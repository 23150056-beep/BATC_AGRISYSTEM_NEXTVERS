from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsAdmin
from apps.announcements.models import Announcement
from apps.announcements.api.serializers import AnnouncementSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        role = self.request.user.role
        qs = Announcement.objects.all()
        if role != "ADMIN":
            # JSONField.__contains is unsupported on SQLite in Django 6.
            # Use SQLite's json_each() to do exact array-membership checks.
            # This is safe on SQLite 3.9+ (we're on 3.45).
            qs = qs.extra(
                where=[
                    "EXISTS ("
                    "  SELECT 1 FROM json_each(announcements_announcement.target_roles)"
                    "  WHERE value = %s"
                    ")"
                ],
                params=[role],
            )
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
