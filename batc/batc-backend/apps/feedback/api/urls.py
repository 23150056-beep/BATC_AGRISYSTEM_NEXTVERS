from rest_framework.routers import DefaultRouter
from apps.feedback.api.views import FeedbackViewSet

router = DefaultRouter()
router.register("feedback", FeedbackViewSet, basename="feedback")

urlpatterns = router.urls
