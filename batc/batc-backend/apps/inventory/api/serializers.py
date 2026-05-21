from rest_framework import serializers
from apps.inventory.models import InventoryItem, StockBatch, StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = ["id", "quantity", "movement_type", "reference_note", "created_by_name", "created_at"]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else "System"


class StockBatchSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()

    class Meta:
        model = StockBatch
        fields = [
            "id", "item", "item_name", "lot_number",
            "received_date", "expiry_date",
            "initial_qty", "current_qty", "created_at",
        ]
        read_only_fields = ["current_qty", "created_at"]

    def get_item_name(self, obj):
        return str(obj.item)


class InventoryItemSerializer(serializers.ModelSerializer):
    total_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    batch_count = serializers.SerializerMethodField()
    # Annotated by the viewset's get_queryset() — set defaults for safety so
    # callers that bypass the annotation (e.g. low-stock action) still serialize.
    reserved_qty = serializers.SerializerMethodField()
    available_qty = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = [
            "id", "name", "category", "unit",
            "low_stock_threshold", "total_stock", "is_low_stock",
            "batch_count", "reserved_qty", "available_qty",
            "created_at",
        ]

    def get_batch_count(self, obj):
        return obj.batches.filter(current_qty__gt=0).count()

    def get_reserved_qty(self, obj):
        # Prefer a queryset-annotated value if present (one query for the whole
        # list). Fall back to a per-row lookup so detail endpoints stay correct.
        annotated = getattr(obj, "_reserved_qty", None)
        if annotated is not None:
            return float(annotated)
        from apps.inventory.selectors import get_item_reserved_map
        return float(get_item_reserved_map([obj.pk]).get(obj.pk, 0))

    def get_available_qty(self, obj):
        total = float(obj.total_stock or 0)
        reserved = self.get_reserved_qty(obj)
        return max(0.0, total - reserved)


class ReceiveStockSerializer(serializers.Serializer):
    lot_number = serializers.CharField()
    received_date = serializers.DateField()
    expiry_date = serializers.DateField(required=False, allow_null=True)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    reference_note = serializers.CharField(required=False, allow_blank=True, default="")


class AdjustStockSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)
    reference_note = serializers.CharField()
