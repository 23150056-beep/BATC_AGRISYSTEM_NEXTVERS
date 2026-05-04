from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel


class NotificationType(models.TextChoices):
    APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED", "Application submitted"
    APPLICATION_APPROVED  = "APPLICATION_APPROVED",  "Application approved"
    APPLICATION_REJECTED  = "APPLICATION_REJECTED",  "Application rejected"
    DISTRIBUTION_SCHEDULED = "DISTRIBUTION_SCHEDULED", "Distribution scheduled"
    DISTRIBUTION_DELIVERED = "DISTRIBUTION_DELIVERED", "Distribution delivered"
    DISTRIBUTION_DELAYED   = "DISTRIBUTION_DELAYED",   "Distribution delayed"
    QUALITY_ISSUE_REPORTED = "QUALITY_ISSUE_REPORTED", "Quality issue reported"


class Notification(TimeStampedModel):
    """Lightweight in-app notification. No email/SMS — just a row in the DB."""
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=40, choices=NotificationType.choices)
    title = models.CharField(max_length=160)
    body  = models.TextField(blank=True)
    # Loose link to source — allows the bell dropdown to navigate the user
    link  = models.CharField(max_length=200, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "read_at"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.type} -> {self.recipient_id}"

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
