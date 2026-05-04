from rest_framework.routers import DefaultRouter
from apps.distribution.api.views import DistributionViewSet

router = DefaultRouter()
router.register("distributions", DistributionViewSet, basename="distribution")

urlpatterns = router.urls
