from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class FeedbackStatus(models.TextChoices):
    NEW          = "NEW",          "New"
    ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
    RESOLVED     = "RESOLVED",     "Resolved"


class IssueType(models.TextChoices):
    GENERAL        = "GENERAL",        "General Feedback"
    DAMAGED        = "DAMAGED",        "Damaged Item"
    EXPIRED        = "EXPIRED",        "Expired / Spoiled Item"
    WRONG_QUANTITY = "WRONG_QUANTITY", "Wrong Quantity"
    WRONG_ITEM     = "WRONG_ITEM",     "Wrong Item Received"


QUALITY_ISSUE_TYPES = {
    IssueType.DAMAGED,
    IssueType.EXPIRED,
    IssueType.WRONG_QUANTITY,
    IssueType.WRONG_ITEM,
}


class Feedback(models.Model):
    farmer       = models.ForeignKey("farmers.Farmer", on_delete=models.CASCADE, related_name="feedback")
    distribution = models.ForeignKey(
        "distribution.Distribution", null=True, blank=True, on_delete=models.SET_NULL, related_name="feedback"
    )
    issue_type   = models.CharField(
        max_length=20, choices=IssueType.choices, default=IssueType.GENERAL
    )
    rating       = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment      = models.TextField(blank=True)
    status       = models.CharField(max_length=20, choices=FeedbackStatus.choices, default=FeedbackStatus.NEW)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Feedback #{self.pk} by {self.farmer} - {self.rating} stars"

    @property
    def is_quality_issue(self) -> bool:
        return self.issue_type in QUALITY_ISSUE_TYPES


class FeedbackReply(models.Model):
    """
    A staff/admin reply attached to a Feedback row.

    Multiple replies are allowed — the panel shows them chronologically so the
    conversation between the farmer (read-only here) and staff stays auditable.
    Authors are restricted at the API layer to STAFF/ADMIN; the FK uses
    SET_NULL so a removed user does not delete their reply history.
    """
    feedback   = models.ForeignKey(
        Feedback, on_delete=models.CASCADE, related_name="replies"
    )
    author     = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
        related_name="feedback_replies",
    )
    message    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["feedback", "created_at"])]

    def __str__(self):
        return f"Reply #{self.pk} on Feedback #{self.feedback_id}"
