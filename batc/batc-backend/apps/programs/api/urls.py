from rest_framework.routers import DefaultRouter
from apps.programs.api.views import ProgramViewSet

router = DefaultRouter()
router.register("programs", ProgramViewSet, basename="program")

urlpatterns = router.urls
