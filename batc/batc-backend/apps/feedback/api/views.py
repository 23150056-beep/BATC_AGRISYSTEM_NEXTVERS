from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from apps.core.permissions import IsStaffOrAdmin
from apps.feedback.models import Feedback, QUALITY_ISSUE_TYPES
from apps.feedback.api.serializers import FeedbackSerializer, FeedbackStatusUpdateSerializer


class _IsClient(BasePermission):
    """Allow only CLIENT-role users (defensive check for feedback writes)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "CLIENT")


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related("farmer", "distribution__program").all()
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        # POST is restricted to clients — staff/admin trying to leave feedback was
        # silently writing under a random encoded farmer (Finding #8).
        if self.action == "create":
            return [IsAuthenticated(), _IsClient()]
        if self.action in ("update_status", "quality_alert_count"):
            return [IsStaffOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Clients only see their own feedback. Use linked_user (Finding #1) —
        # encoded_by would silently miss seeded farmers.
        if user.is_client:
            qs = qs.filter(farmer__linked_user=user)
        if s := self.request.query_params.get("status"):
            qs = qs.filter(status=s)
        if it := self.request.query_params.get("issue_type"):
            qs = qs.filter(issue_type=it)
        # quality=true filter — returns all non-GENERAL issue types
        if self.request.query_params.get("quality") == "true":
            qs = qs.filter(issue_type__in=list(QUALITY_ISSUE_TYPES))
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Resolve farmer via the linked_user FK (one-to-one). farmer_profile is
        # the related_name set on Farmer.linked_user.
        farmer = getattr(user, "farmer_profile", None)
        if not farmer or farmer.is_archived:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("No linked farmer profile found for this account.")
        serializer.save(farmer=farmer)

    @action(detail=True, methods=["post"], url_path="update-status", permission_classes=[IsStaffOrAdmin])
    def update_status(self, request, pk=None):
        feedback = self.get_object()
        ser = FeedbackStatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        feedback.status = ser.validated_data["status"]
        feedback.save(update_fields=["status"])
        return Response(FeedbackSerializer(feedback).data)

    @action(detail=False, methods=["get"], url_path="quality-alert-count", permission_classes=[IsStaffOrAdmin])
    def quality_alert_count(self, request):
        """Returns count of unresolved quality issues for nav badge."""
        count = Feedback.objects.filter(
            issue_type__in=list(QUALITY_ISSUE_TYPES),
            status__in=["NEW", "ACKNOWLEDGED"],
        ).count()
        return Response({"count": count})
