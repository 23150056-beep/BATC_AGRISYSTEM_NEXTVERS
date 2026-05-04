from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel


class DistributionStatus(models.TextChoices):
    SCHEDULED    = "SCHEDULED",    "Scheduled"
    DELIVERED    = "DELIVERED",    "Delivered"
    DELAYED      = "DELAYED",      "Delayed"
    RESCHEDULED  = "RESCHEDULED",  "Rescheduled"
    OUT_OF_STOCK = "OUT_OF_STOCK", "Out of Stock"
    UNAVAILABLE  = "UNAVAILABLE",  "Unavailable"


_VALID_TRANSITIONS = {
    "SCHEDULED":   {"DELIVERED", "DELAYED", "RESCHEDULED", "OUT_OF_STOCK", "UNAVAILABLE"},
    "DELAYED":     {"RESCHEDULED", "DELIVERED", "OUT_OF_STOCK", "UNAVAILABLE"},
    "RESCHEDULED": {"DELIVERED", "DELAYED", "OUT_OF_STOCK", "UNAVAILABLE"},
}


class Distribution(TimeStampedModel):
    application    = models.OneToOneField(
        "applications.InterventionApplication", on_delete=models.CASCADE, related_name="distribution"
    )
    program        = models.ForeignKey("programs.Program", on_delete=models.CASCADE, related_name="distributions")
    farmer         = models.ForeignKey("farmers.Farmer", on_delete=models.CASCADE, related_name="distributions")
    status         = models.CharField(max_length=20, choices=DistributionStatus.choices, default=DistributionStatus.SCHEDULED, db_index=True)
    scheduled_date = models.DateField(null=True, blank=True, db_index=True)
    delivered_at   = models.DateTimeField(null=True, blank=True)
    remarks        = models.TextField(blank=True)
    updated_by     = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_distributions"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Distribution #{self.pk} — {self.farmer} ({self.status})"

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in _VALID_TRANSITIONS.get(self.status, set())


class DistributionItem(models.Model):
    distribution       = models.ForeignKey(Distribution, on_delete=models.CASCADE, related_name="items")
    batch              = models.ForeignKey("inventory.StockBatch", on_delete=models.PROTECT, related_name="distribution_items")
    quantity_planned   = models.DecimalField(max_digits=12, decimal_places=3)
    quantity_released  = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    def __str__(self):
        return f"DistributionItem #{self.pk} — batch {self.batch_id}"
