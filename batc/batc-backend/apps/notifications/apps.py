from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"

    def ready(self):
        # Wire up post_save signals on Application/Distribution to create notifications
        from . import signals  # noqa: F401
