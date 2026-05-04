from rest_framework import serializers
from apps.announcements.models import Announcement

VALID_ROLES = {"ADMIN", "STAFF", "CLIENT"}


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = Announcement
        fields = ["id", "title", "body", "target_roles", "published_at", "created_by", "created_by_name"]
        read_only_fields = ["published_at", "created_by"]

    def validate_target_roles(self, value):
        if not value:
            raise serializers.ValidationError("Select at least one audience role.")
        invalid = set(value) - VALID_ROLES
        if invalid:
            raise serializers.ValidationError(f"Invalid roles: {', '.join(invalid)}.")
        # Deduplicate while preserving order
        seen = []
        for r in value:
            if r not in seen:
                seen.append(r)
        return seen
