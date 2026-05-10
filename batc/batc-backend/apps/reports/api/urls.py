from django.urls import path
from apps.reports.api.views import (
    ReportSummaryView,
    FarmersReportView,
    DistributionsReportView,
    InventoryReportView,
    ApplicationsReportView,
    FeedbackReportView,
)

urlpatterns = [
    path("reports/summary/",       ReportSummaryView.as_view(),       name="report-summary"),
    path("reports/farmers/",       FarmersReportView.as_view(),       name="report-farmers"),
    path("reports/distributions/", DistributionsReportView.as_view(), name="report-distributions"),
    path("reports/inventory/",     InventoryReportView.as_view(),     name="report-inventory"),
    path("reports/applications/",  ApplicationsReportView.as_view(),  name="report-applications"),
    path("reports/feedback/",      FeedbackReportView.as_view(),      name="report-feedback"),
]
