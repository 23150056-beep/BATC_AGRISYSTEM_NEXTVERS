from django.urls import path
from apps.reports.api.views import FarmersReportView, DistributionsReportView, InventoryReportView

urlpatterns = [
    path("reports/farmers/", FarmersReportView.as_view(), name="report-farmers"),
    path("reports/distributions/", DistributionsReportView.as_view(), name="report-distributions"),
    path("reports/inventory/", InventoryReportView.as_view(), name="report-inventory"),
]
