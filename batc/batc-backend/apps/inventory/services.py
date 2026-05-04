from decimal import Decimal
from django.db import transaction
from django.db.models import F
from apps.inventory.models import InventoryItem, StockBatch, StockMovement, MovementType


@transaction.atomic
def receive_stock(
    item_id: int,
    lot_number: str,
    received_date,
    expiry_date,
    quantity: Decimal,
    created_by,
    reference_note: str = "",
) -> StockBatch:
    batch = StockBatch.objects.create(
        item_id=item_id,
        lot_number=lot_number,
        received_date=received_date,
        expiry_date=expiry_date,
        initial_qty=quantity,
        current_qty=quantity,
    )
    StockMovement.objects.create(
        batch=batch,
        quantity=quantity,
        movement_type=MovementType.RECEIVE,
        reference_note=reference_note,
        created_by=created_by,
    )
    return batch


@transaction.atomic
def adjust_stock(
    batch_id: int,
    quantity: Decimal,
    reference_note: str,
    created_by,
) -> StockBatch:
    batch = StockBatch.objects.select_for_update().get(pk=batch_id)
    new_qty = batch.current_qty + quantity
    if new_qty < 0:
        raise ValueError(f"Adjustment would result in negative stock ({new_qty}).")

    StockBatch.objects.filter(pk=batch_id).update(current_qty=F("current_qty") + quantity)
    StockMovement.objects.create(
        batch=batch,
        quantity=quantity,
        movement_type=MovementType.ADJUSTMENT,
        reference_note=reference_note,
        created_by=created_by,
    )
    batch.refresh_from_db()
    return batch


@transaction.atomic
def release_stock(batch_id: int, quantity: Decimal, reference_note: str, created_by) -> StockBatch:
    """Decrement stock for a confirmed distribution delivery."""
    batch = StockBatch.objects.select_for_update().get(pk=batch_id)
    if batch.current_qty < quantity:
        raise ValueError(f"Cannot release {quantity} — only {batch.current_qty} available.")

    StockBatch.objects.filter(pk=batch_id).update(current_qty=F("current_qty") - quantity)
    StockMovement.objects.create(
        batch=batch,
        quantity=-quantity,
        movement_type=MovementType.RELEASE,
        reference_note=reference_note,
        created_by=created_by,
    )
    batch.refresh_from_db()
    return batch
