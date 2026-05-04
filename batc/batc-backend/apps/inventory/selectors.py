from decimal import Decimal
from django.db.models import F
from apps.inventory.models import StockBatch


def get_fefo_batches(item_id: int, qty_needed: Decimal, lock: bool = False) -> list[tuple[StockBatch, Decimal]]:
    """
    Returns a list of ``(batch, allocated_qty)`` tuples covering ``qty_needed``
    ordered by expiry_date ASC then received_date ASC (First-Expire-First-Out).

    NULL ``expiry_date`` rows (non-perishables) are sorted LAST so SQLite and
    Postgres behave identically (Finding #12). Default Postgres = nulls last,
    default SQLite = nulls first — without this hint the dev database would
    release non-perishables first and prod would do the opposite.

    Set ``lock=True`` to take a row-level lock on the candidate batches —
    callers running inside ``transaction.atomic()`` should use this to prevent
    concurrent over-allocation (Finding #11).

    Raises ``ValueError`` if total available stock is insufficient.
    """
    batches = StockBatch.objects.filter(
        item_id=item_id,
        current_qty__gt=0,
    ).order_by(F("expiry_date").asc(nulls_last=True), "received_date")

    if lock:
        # select_for_update must be inside an atomic block; the caller is
        # responsible for that. SQLite ignores the lock silently, which is fine
        # for the prototype dev DB.
        batches = batches.select_for_update()

    result = []
    remaining = qty_needed

    for batch in batches:
        if remaining <= 0:
            break
        take = min(batch.current_qty, remaining)
        result.append((batch, take))
        remaining -= take

    if remaining > 0:
        raise ValueError(f"Insufficient stock. Short by {remaining}.")

    return result
