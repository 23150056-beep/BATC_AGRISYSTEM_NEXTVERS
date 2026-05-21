from rest_framework import serializers
from apps.announcements.models import Announcement, VALID_SEGMENTS
from apps.farmers.constants import BAUANG_BARANGAYS

VALID_ROLES = {"ADMIN", "STAFF", "CLIENT"}


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = Announcement
        fields = [
            "id", "title", "body",
            "target_roles", "target_barangay", "target_segments",
            "is_pinned",
            "published_at", "created_by", "created_by_name",
        ]
        read_only_fields = ["published_at", "created_by"]

    # ----- field-level validation ----------------------------------------
    def validate_target_roles(self, value):
        if not value:
            raise serializers.ValidationError("Select at least one audience role.")
        invalid = set(value) - VALID_ROLES
        if invalid:
            raise serializers.ValidationError(f"Invalid roles: {', '.join(invalid)}.")
        # Deduplicate while preserving order so the UI's ordering is honored.
        seen = []
        for r in value:
            if r not in seen:
                seen.append(r)
        return seen

    def validate_target_barangay(self, value):
        if not value:
            return ""
        if value not in BAUANG_BARANGAYS:
            raise serializers.ValidationError(f"Unknown barangay: {value}.")
        return value

    def validate_target_segments(self, value):
        if not value:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("target_segments must be a list.")
        invalid = set(value) - VALID_SEGMENTS
        if invalid:
            raise serializers.ValidationError(
                f"Invalid segments: {', '.join(sorted(invalid))}. "
                f"Allowed: {', '.join(sorted(VALID_SEGMENTS))}."
            )
        # Deduplicate
        seen = []
        for s in value:
            if s not in seen:
                seen.append(s)
        return seen

    # ----- object-level validation --------------------------------------
    def validate(self, attrs):
        # Subgroup filters only make sense when farmers are in the audience.
        roles = attrs.get("target_roles", getattr(self.instance, "target_roles", []) or [])
        bgy = attrs.get("target_barangay", getattr(self.instance, "target_barangay", "") or "")
        segs = attrs.get("target_segments", getattr(self.instance, "target_segments", []) or [])
        if (bgy or segs) and "CLIENT" not in roles:
            raise serializers.ValidationError({
                "target_roles": (
                    "Barangay and segment filters only apply to farmer-targeted "
                    "announcements. Add 'CLIENT' to target_roles or clear the filters."
                )
            })
        return attrs
