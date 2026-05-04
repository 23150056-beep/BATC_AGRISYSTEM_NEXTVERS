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

    class Meta:
        model = InventoryItem
        fields = [
            "id", "name", "category", "unit",
            "low_stock_threshold", "total_stock", "is_low_stock",
            "batch_count", "created_at",
        ]

    def get_batch_count(self, obj):
        return obj.batches.filter(current_qty__gt=0).count()


class ReceiveStockSerializer(serializers.Serializer):
    lot_number = serializers.CharField()
    received_date = serializers.DateField()
    expiry_date = serializers.DateField(required=False, allow_null=True)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    reference_note = serializers.CharField(required=False, allow_blank=True, default="")


class AdjustStockSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)
    reference_note = serializers.CharField()
