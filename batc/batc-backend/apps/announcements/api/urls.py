from rest_framework.routers import DefaultRouter
from apps.announcements.api.views import AnnouncementViewSet

router = DefaultRouter()
router.register("announcements", AnnouncementViewSet, basename="announcement")

urlpatterns = router.urls
