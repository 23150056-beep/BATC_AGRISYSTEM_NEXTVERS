from rest_framework.routers import DefaultRouter
from apps.farmers.api.views import FarmerViewSet

router = DefaultRouter()
router.register("farmers", FarmerViewSet, basename="farmer")

urlpatterns = router.urls
