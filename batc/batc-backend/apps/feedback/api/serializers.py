from rest_framework import serializers
from apps.feedback.models import Feedback, FeedbackReply, QUALITY_ISSUE_TYPES


class FeedbackReplySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.CharField(source="author.role", read_only=True)

    class Meta:
        model = FeedbackReply
        fields = ["id", "feedback", "author", "author_name", "author_role",
                  "message", "created_at"]
        read_only_fields = ["feedback", "author", "author_name", "author_role", "created_at"]

    def get_author_name(self, obj):
        if not obj.author_id:
            return "BATC team"
        full = obj.author.get_full_name() if hasattr(obj.author, "get_full_name") else ""
        return full or obj.author.username

    def validate_message(self, value: str):
        v = (value or "").strip()
        if not v:
            raise serializers.ValidationError("Reply cannot be empty.")
        if len(v) > 4000:
            raise serializers.ValidationError("Reply is too long (max 4000 characters).")
        return v


class FeedbackSerializer(serializers.ModelSerializer):
    farmer_name      = serializers.CharField(source="farmer.full_name", read_only=True)
    program_name     = serializers.SerializerMethodField()
    is_quality_issue = serializers.SerializerMethodField()
    replies          = FeedbackReplySerializer(many=True, read_only=True)
    reply_count      = serializers.IntegerField(source="replies.count", read_only=True)

    class Meta:
        model  = Feedback
        fields = [
            "id", "farmer", "farmer_name", "distribution", "program_name",
            "issue_type", "is_quality_issue",
            "rating", "comment", "status", "created_at",
            "replies", "reply_count",
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
