from django.db import models
from django.conf import settings


class ActionLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="action_logs"
    )
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100, blank=True)
    target_id = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor} — {self.action} ({self.created_at:%Y-%m-%d %H:%M})"


def log_action(actor, action: str, target=None, notes: str = ""):
    ActionLog.objects.create(
        actor=actor,
        action=action,
        target_model=type(target).__name__ if target else "",
        target_id=getattr(target, "pk", None),
        notes=notes,
    )
