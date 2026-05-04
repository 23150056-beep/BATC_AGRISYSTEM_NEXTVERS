from rest_framework import serializers
from apps.feedback.models import Feedback, QUALITY_ISSUE_TYPES


class FeedbackSerializer(serializers.ModelSerializer):
    farmer_name      = serializers.CharField(source="farmer.full_name", read_only=True)
    program_name     = serializers.SerializerMethodField()
    is_quality_issue = serializers.SerializerMethodField()

    class Meta:
        model  = Feedback
        fields = [
            "id", "farmer", "farmer_name", "distribution", "program_name",
            "issue_type", "is_quality_issue",
            "rating", "comment", "status", "created_at",
        ]
        read_only_fields = ["farmer", "status", "created_at"]

    def get_program_name(self, obj):
        if obj.distribution and obj.distribution.program:
            return obj.distribution.program.name
        return None

    def get_is_quality_issue(self, obj):
        return obj.issue_type in QUALITY_ISSUE_TYPES


class FeedbackStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["NEW", "ACKNOWLEDGED", "RESOLVED"])
