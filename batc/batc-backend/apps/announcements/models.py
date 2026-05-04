from django.db import models
from django.conf import settings


class Announcement(models.Model):
    title        = models.CharField(max_length=200)
    body         = models.TextField()
    target_roles = models.JSONField(default=list)  # e.g. ["ADMIN","STAFF","CLIENT"]
    published_at = models.DateTimeField(auto_now_add=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="announcements"
    )

    class Meta:
        ordering = ["-published_at"]

    def __str__(self):
        return self.title
