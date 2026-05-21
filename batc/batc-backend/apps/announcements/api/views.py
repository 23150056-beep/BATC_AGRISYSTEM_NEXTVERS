from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsAdmin
from apps.announcements.models import Announcement
from apps.announcements.api.serializers import AnnouncementSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role
        qs = Announcement.objects.all()

        # ADMIN sees every announcement.
        if role == "ADMIN":
            return qs

        # STAFF/CLIENT: must be in target_roles. JSONField.__contains is
        # unsupported on SQLite in Django 6, so we use SQLite's json_each().
        qs = qs.extra(
            where=[
                "EXISTS ("
                "  SELECT 1 FROM json_each(announcements_announcement.target_roles)"
                "  WHERE value = %s"
                ")"
            ],
            params=[role],
        )

        # STAFF: no subgroup filters (target_barangay/segments apply only to farmers).
        if role == "STAFF":
            return qs

        # ---- CLIENT: also filter by the farmer's barangay + segments ------
        farmer = getattr(user, "farmer_profile", None)
        if farmer is not None and farmer.is_archived:
            farmer = None

        if farmer is None:
            # Orphan CLIENT — only broadcasts (no barangay, no segments).
            return qs.filter(target_barangay="").extra(
                where=["json_array_length(announcements_announcement.target_segments) = 0"]
            )

        # Narrow in SQL by barangay (cheap), refine segments in Python.
        narrowed = qs.filter(target_barangay__in=("", farmer.barangay))
        return [a for a in narrowed if a.visible_to_farmer(farmer)]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
