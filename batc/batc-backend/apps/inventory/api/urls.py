from rest_framework.routers import DefaultRouter
from apps.inventory.api.views import InventoryItemViewSet, StockBatchViewSet

router = DefaultRouter()
router.register("inventory/items", InventoryItemViewSet, basename="inventory-item")
router.register("inventory/batches", StockBatchViewSet, basename="stock-batch")

urlpatterns = router.urls
