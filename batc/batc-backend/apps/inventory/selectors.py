from decimal import Decimal
from django.db.models import F, Sum, Q
from django.db.models.functions import Coalesce
from apps.inventory.models import StockBatch


# Distribution states whose DistributionItems still hold a soft reservation
# against a StockBatch (planned but not yet released). DELIVERED/OUT_OF_STOCK/
# UNAVAILABLE/CANCELLED don't reserve — DELIVERED already debited current_qty,
# the rest released their hold.
RESERVED_DIST_STATES = ("SCHEDULED", "DELAYED", "RESCHEDULED")


def _reserved_per_batch_subquery(exclude_distribution_id: int | None = None):
    """
    Return a Subquery expression that yields the total quantity reserved on a
    given StockBatch (planned − already released) across all distributions in
    a "still holds stock" state.

    Used as an annotation on StockBatch queries so callers can compute
    available_qty = current_qty - reserved_qty in pure SQL.
    """
    from apps.distribution.models import DistributionItem  # avoid circular at import time

    qs = DistributionItem.objects.filter(
        batch_id=F("pk"),  # placeholder — overridden when used as Subquery
        distribution__status__in=RESERVED_DIST_STATES,
    )
    if exclude_distribution_id is not None:
        qs = qs.exclude(distribution_id=exclude_distribution_id)
    return qs


def get_batch_reserved_map(item_id: int, exclude_distribution_id: int | None = None) -> dict[int, Decimal]:
    """
    Build a {batch_id: reserved_qty} map for an item. Reserved = sum of
    (quantity_planned - quantity_released) across all DistributionItems whose
    distribution is currently SCHEDULED/DELAYED/RESCHEDULED.
    """
    from apps.distribution.models import DistributionItem

    qs = DistributionItem.objects.filter(
        batch__item_id=item_id,
        distribution__status__in=RESERVED_DIST_STATES,
    )
    if exclude_distribution_id is not None:
        qs = qs.exclude(distribution_id=exclude_distribution_id)

    rows = (
        qs.values("batch_id")
        .annotate(reserved=Coalesce(Sum(F("quantity_planned") - F("quantity_released")), Decimal("0")))
    )
    return {r["batch_id"]: r["reserved"] for r in rows}


def get_fefo_batches(
    item_id: int,
    qty_needed: Decimal,
    lock: bool = False,
    exclude_distribution_id: int | None = None,
) -> list[tuple[StockBatch, Decimal]]:
    """
    Returns a list of ``(batch, allocated_qty)`` tuples covering ``qty_needed``
    ordered by expiry_date ASC then received_date ASC (First-Expire-First-Out).

    Each batch's available capacity is computed as
        current_qty − Σ (quantity_planned − quantity_released for live distributions)
    so a second approval can never reserve units already promised to another
    pending distribution. The previous version allocated against ``current_qty``
    only — which lets two concurrent approvals double-book the same batch and
    then fails at delivery time. This is the fix for that gap.

    NULL ``expiry_date`` rows (non-perishables) are sorted LAST so SQLite and
    Postgres behave identically (Finding #12).

    Set ``lock=True`` to take a row-level lock on the candidate batches —
    callers running inside ``transaction.atomic()`` should use this to prevent
    concurrent over-allocation (Finding #11).

    ``exclude_distribution_id`` is for re-allocation: when a distribution is
    re-planned, exclude its own existing reservations from the "already taken"
    accounting so it doesn't compete with itself.

    Raises ``ValueError`` if total available stock is insufficient.
    """
    batches = StockBatch.objects.filter(
        item_id=item_id,
        current_qty__gt=0,
    ).order_by(F("expiry_date").asc(nulls_last=True), "received_date")

    if lock:
        batches = batches.select_for_update()

    reserved_map = get_batch_reserved_map(item_id, exclude_distribution_id=exclude_distribution_id)

    result: list[tuple[StockBatch, Decimal]] = []
    remaining = qty_needed

    for batch in batches:
        if remaining <= 0:
            break
        already_reserved = reserved_map.get(batch.pk, Decimal("0"))
        free = batch.current_qty - already_reserved
        if free <= 0:
            continue
        take = min(free, remaining)
        result.append((batch, take))
        remaining -= take

    if remaining > 0:
        raise ValueError(f"Insufficient stock. Short by {remaining}.")

    return result


def get_item_reserved_map(item_ids: list[int]) -> dict[int, Decimal]:
    """
    Total reserved per InventoryItem across all of its batches. Used to annotate
    the inventory list endpoint with reserved_qty / available_qty in one query.
    """
    from apps.distribution.models import DistributionItem

    if not item_ids:
        return {}

    rows = (
        DistributionItem.objects
        .filter(
            batch__item_id__in=item_ids,
            distribution__status__in=RESERVED_DIST_STATES,
        )
        .values("batch__item_id")
        .annotate(reserved=Coalesce(Sum(F("quantity_planned") - F("quantity_released")), Decimal("0")))
    )
    return {r["batch__item_id"]: r["reserved"] for r in rows}
