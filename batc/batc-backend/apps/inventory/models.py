from django.db import models
from django.db.models import F


class ItemCategory(models.TextChoices):
    SEEDS = "SEEDS", "Seeds"
    FERTILIZER = "FERTILIZER", "Fertilizer"
    PESTICIDE = "PESTICIDE", "Pesticide"
    TOOLS = "TOOLS", "Tools / Equipment"
    OTHER = "OTHER", "Other"


class ItemUnit(models.TextChoices):
    KG = "kg", "Kilogram (kg)"
    BAG = "bag", "Bag"
    LITER = "L", "Liter (L)"
    PIECE = "pc", "Piece"
    PACK = "pack", "Pack"
    SACK = "sack", "Sack"


class InventoryItem(models.Model):
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=ItemCategory.choices, default=ItemCategory.SEEDS)
    unit = models.CharField(max_length=10, choices=ItemUnit.choices, default=ItemUnit.KG)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.unit})"

    @property
    def total_stock(self):
        return self.batches.filter(current_qty__gt=0).aggregate(
            total=models.Sum("current_qty")
        )["total"] or 0

    @property
    def is_low_stock(self):
        return self.total_stock <= self.low_stock_threshold


class StockBatch(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="batches")
    lot_number = models.CharField(max_length=100)
    received_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    initial_qty = models.DecimalField(max_digits=10, decimal_places=2)
    current_qty = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["expiry_date", "received_date"]
        # Audit/recall traceability requires lot numbers to be unique per item
        # (Finding #13). Two batches with the same lot are almost always a
        # data-entry mistake — surface them as a friendly serializer error.
        constraints = [
            models.UniqueConstraint(fields=["item", "lot_number"], name="uniq_item_lot"),
        ]

    def __str__(self):
        return f"{self.item.name} — Lot {self.lot_number}"


class MovementType(models.TextChoices):
    RECEIVE = "RECEIVE", "Receive"
    RELEASE = "RELEASE", "Release (Distribution)"
    ADJUSTMENT = "ADJUSTMENT", "Manual Adjustment"


class StockMovement(models.Model):
    batch = models.ForeignKey(StockBatch, on_delete=models.CASCADE, related_name="movements")
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # signed: + in, - out
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    reference_note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        "accounts.User", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="stock_movements"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
