from django.urls import path
from apps.core.api.views import AdminDashboardView, StaffDashboardView

urlpatterns = [
    path("dashboard/admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
    path("dashboard/staff/", StaffDashboardView.as_view(), name="dashboard-staff"),
]
