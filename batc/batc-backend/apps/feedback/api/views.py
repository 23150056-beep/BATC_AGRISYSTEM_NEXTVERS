from django.db.models import Prefetch

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from apps.core.permissions import IsStaffOrAdmin
from apps.feedback.models import Feedback, FeedbackReply, FeedbackStatus, QUALITY_ISSUE_TYPES
from apps.feedback.api.serializers import (
    FeedbackSerializer, FeedbackStatusUpdateSerializer, FeedbackReplySerializer,
)


class _IsClient(BasePermission):
    """Allow only CLIENT-role users (defensive check for feedback writes)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "CLIENT")


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = (
        Feedback.objects
        .select_related("farmer", "distribution__program")
        .prefetch_related(Prefetch("replies", queryset=FeedbackReply.objects.select_related("author")))
        .all()
    )
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        # POST is restricted to clients — staff/admin trying to leave feedback was
        # silently writing under a random encoded farmer (Finding #8).
        if self.action == "create":
            return [IsAuthenticated(), _IsClient()]
        if self.action in ("update_status", "quality_alert_count", "reply"):
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

    @action(detail=True, methods=["post"], url_path="reply", permission_classes=[IsStaffOrAdmin])
    def reply(self, request, pk=None):
        """
        Post a staff/admin reply on a piece of feedback.

        Side-effects (so the reply is "wired" through the system, not just a row):
          * Creates a FeedbackReply attributed to request.user.
          * Auto-acknowledges a NEW feedback so the queue counter drops.
          * Pushes a Notification to the farmer's CLIENT user (when one exists).
          * Writes an ActionLog entry for audit.
        """
        feedback = self.get_object()
        ser = FeedbackReplySerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        reply = FeedbackReply.objects.create(
            feedback=feedback,
            author=request.user,
            message=ser.validated_data["message"],
        )

        # Auto-bump status: a reply on a NEW item implies the team has seen it.
        if feedback.status == FeedbackStatus.NEW:
            feedback.status = FeedbackStatus.ACKNOWLEDGED
            feedback.save(update_fields=["status"])

        # Notify the farmer (best-effort — never block the reply on a notify failure).
        try:
            from apps.notifications.models import Notification, NotificationType
            farmer_user = getattr(feedback.farmer, "linked_user", None)
            if farmer_user:
                program_name = (
                    feedback.distribution.program.name
                    if feedback.distribution and feedback.distribution.program_id
                    else "your feedback"
                )
                Notification.objects.create(
                    recipient=farmer_user,
                    type=NotificationType.QUALITY_ISSUE_REPORTED,
                    title="BATC replied to your feedback",
                    body=f"A staff member replied to your feedback on {program_name}.",
                    link="/app/feedback",
                )
        except Exception:
            pass

        # Audit trail.
        try:
            from apps.audit.models import log_action
            log_action(
                request.user, "FEEDBACK_REPLIED", feedback,
                notes=(reply.message[:120] + "…") if len(reply.message) > 120 else reply.message,
            )
        except Exception:
            pass

        # Return the FULL feedback (with the new reply embedded) so the panel
        # can replace its selected row in one round trip.
        feedback.refresh_from_db()
        return Response(FeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED)
