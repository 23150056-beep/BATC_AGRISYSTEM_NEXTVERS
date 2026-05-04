from rest_framework import serializers
from apps.distribution.models import Distribution, DistributionItem


class DistributionItemSerializer(serializers.ModelSerializer):
    item_name  = serializers.CharField(source="batch.item.name", read_only=True)
    lot_number = serializers.CharField(source="batch.lot_number", read_only=True)
    unit       = serializers.CharField(source="batch.item.unit", read_only=True)

    class Meta:
        model = DistributionItem
        fields = ["id", "batch", "item_name", "lot_number", "unit", "quantity_planned", "quantity_released"]


class DistributionListSerializer(serializers.ModelSerializer):
    farmer_name    = serializers.CharField(source="farmer.full_name", read_only=True)
    farmer_barangay = serializers.CharField(source="farmer.barangay", read_only=True)
    program_name   = serializers.CharField(source="program.name", read_only=True)
    program_code   = serializers.CharField(source="program.code", read_only=True)
    updated_by_name = serializers.CharField(source="updated_by.get_full_name", read_only=True)
    items          = DistributionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Distribution
        fields = [
            "id", "application", "program", "program_name", "program_code",
            "farmer", "farmer_name", "farmer_barangay",
            "status", "scheduled_date", "delivered_at", "remarks",
            "updated_by", "updated_by_name", "items", "created_at",
        ]


class StatusUpdateSerializer(serializers.Serializer):
    new_status = serializers.CharField()
    remarks    = serializers.CharField(allow_blank=True, default="")
    scheduled_date = serializers.DateField(required=False, allow_null=True)


class BulkAllocateSerializer(serializers.Serializer):
    program_id     = serializers.IntegerField()
    scheduled_date = serializers.DateField(required=False, allow_null=True)
