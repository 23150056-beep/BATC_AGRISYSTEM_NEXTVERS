from django.urls import path, include

urlpatterns = [
    path("", include("apps.core.api.urls")),
    path("", include("apps.accounts.api.urls")),
    path("", include("apps.farmers.api.urls")),
    path("", include("apps.inventory.api.urls")),
    path("", include("apps.programs.api.urls")),
    path("", include("apps.applications.api.urls")),
    path("", include("apps.distribution.api.urls")),
    path("", include("apps.announcements.api.urls")),
    path("", include("apps.feedback.api.urls")),
    path("", include("apps.reports.api.urls")),
    path("", include("apps.notifications.api.urls")),
]
