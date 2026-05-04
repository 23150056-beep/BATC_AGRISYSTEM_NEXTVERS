from django.db import models
from django.db.models import Q, UniqueConstraint
from django.conf import settings
from apps.core.models import TimeStampedModel


class ApplicationStatus(models.TextChoices):
    SUBMITTED    = "SUBMITTED",    "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    APPROVED     = "APPROVED",     "Approved"
    REJECTED     = "REJECTED",     "Rejected"
    CANCELLED    = "CANCELLED",    "Cancelled"
    FULFILLED    = "FULFILLED",    "Fulfilled"


class InterventionApplication(TimeStampedModel):
    farmer   = models.ForeignKey("farmers.Farmer", on_delete=models.CASCADE, related_name="applications")
    program  = models.ForeignKey("programs.Program", on_delete=models.CASCADE, related_name="applications")
    status   = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.SUBMITTED, db_index=True)

    submitted_at  = models.DateTimeField(auto_now_add=True)
    reviewed_at   = models.DateTimeField(null=True, blank=True)
    reviewed_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_applications"
    )
    rejection_reason = models.TextField(blank=True)
    notes            = models.TextField(blank=True)

    class Meta:
        ordering = ["-submitted_at"]
        # Only ACTIVE applications are unique per (farmer, program). REJECTED and
        # CANCELLED rows can coexist so the farmer can re-apply later (Finding #7).
        constraints = [
            UniqueConstraint(
                fields=["farmer", "program"],
                condition=Q(status__in=["SUBMITTED", "UNDER_REVIEW", "APPROVED", "FULFILLED"]),
                name="uniq_active_application",
            ),
        ]

    def __str__(self):
        return f"{self.farmer} -> {self.program} ({self.status})"
