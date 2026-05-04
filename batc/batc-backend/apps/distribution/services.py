from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.distribution.models import Distribution, DistributionItem, DistributionStatus
from apps.inventory.selectors import get_fefo_batches
from apps.inventory.services import release_stock
from apps.audit.models import log_action


@transaction.atomic
def create_distribution(application, by_user=None) -> Distribution:
    """Create a Distribution with DistributionItems pre-allocated via FEFO."""
    distribution = Distribution.objects.create(
        application=application,
        program=application.program,
        farmer=application.farmer,
    )

    for program_item in application.program.items.select_related("inventory_item"):
        qty_needed = Decimal(program_item.qty_per_beneficiary)
        # lock=True takes a row-level lock on candidate batches inside this
        # @transaction.atomic block — prevents concurrent approvals from
        # planning against the same available quantities (Finding #11).
        allocations = get_fefo_batches(program_item.inventory_item_id, qty_needed, lock=True)
        for batch, allocated_qty in allocations:
            DistributionItem.objects.create(
                distribution=distribution,
                batch=batch,
                quantity_planned=allocated_qty,
            )

    log_action(by_user, "DISTRIBUTION_CREATED", distribution,
               notes=f"Application #{application.pk}")
    return distribution


@transaction.atomic
def update_status(
    distribution: Distribution,
    new_status: str,
    remarks: str,
    by_user,
    scheduled_date=None,
) -> Distribution:
    """
    State-machine guarded status update.

    The transition is validated FIRST. ``scheduled_date`` (if provided) is
    only persisted alongside the successful transition — previously the view
    would write the new date before calling this function, which left the
    date silently mutated when the transition validation failed (Finding #5).
    """
    if not distribution.can_transition_to(new_status):
        raise ValueError(
            f"Cannot transition from '{distribution.status}' to '{new_status}'."
        )

    if new_status == DistributionStatus.DELIVERED:
        _release_stock_for_delivery(distribution, by_user)
        distribution.delivered_at = timezone.now()

        # Mark linked application as FULFILLED
        from apps.applications.models import ApplicationStatus
        app = distribution.application
        app.status = ApplicationStatus.FULFILLED
        app.save(update_fields=["status"])

    distribution.status = new_status
    distribution.remarks = remarks
    distribution.updated_by = by_user
    if scheduled_date is not None:
        distribution.scheduled_date = scheduled_date
    distribution.save()

    log_action(by_user, f"DISTRIBUTION_{new_status}", distribution, notes=remarks)
    return distribution


def _release_stock_for_delivery(distribution: Distribution, by_user):
    """Decrement stock for each DistributionItem via StockMovement."""
    for item in distribution.items.select_related("batch").select_for_update():
        qty = item.quantity_planned - item.quantity_released
        if qty <= 0:
            continue
        release_stock(
            batch_id=item.batch_id,
            quantity=qty,
            reference_note=f"Distribution #{distribution.pk}",
            created_by=by_user,
        )
        item.quantity_released = item.quantity_planned
        item.save(update_fields=["quantity_released"])
