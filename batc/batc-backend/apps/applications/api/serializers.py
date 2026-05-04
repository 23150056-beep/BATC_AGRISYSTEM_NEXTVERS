from rest_framework import serializers
from apps.applications.models import InterventionApplication


class ApplicationListSerializer(serializers.ModelSerializer):
    farmer_name   = serializers.CharField(source="farmer.full_name", read_only=True)
    farmer_barangay = serializers.CharField(source="farmer.barangay", read_only=True)
    program_name  = serializers.CharField(source="program.name", read_only=True)
    program_code  = serializers.CharField(source="program.code", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)

    class Meta:
        model = InterventionApplication
        fields = [
            "id", "farmer", "farmer_name", "farmer_barangay",
            "program", "program_name", "program_code",
            "status", "submitted_at", "reviewed_at",
            "reviewed_by", "reviewed_by_name", "rejection_reason", "notes",
        ]


class ApplicationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterventionApplication
        fields = ["farmer", "program", "notes"]


class RejectSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=1)


class StatusUpdateSerializer(serializers.Serializer):
    new_status = serializers.CharField()
    remarks    = serializers.CharField(allow_blank=True, default="")
