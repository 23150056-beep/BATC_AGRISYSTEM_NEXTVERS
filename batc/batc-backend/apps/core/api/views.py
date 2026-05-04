from django.utils import timezone
from django.db.models import Sum, Subquery, OuterRef, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsStaffOrAdmin, IsAdmin


def _low_stock_count():
    """M-11: count low-stock items in SQL — no Python-level N+1."""
    from apps.inventory.models import InventoryItem, StockBatch
    from django.db import models as db_models
    stock_sq = Subquery(
        StockBatch.objects
        .filter(item=OuterRef("pk"), current_qty__gt=0)
        .values("item")
        .annotate(total=Sum("current_qty"))
        .values("total"),
        output_field=DecimalField(),
    )
    return (
        InventoryItem.objects
        .annotate(annotated_stock=Coalesce(stock_sq, 0, output_field=DecimalField()))
        .filter(annotated_stock__lte=db_models.F("low_stock_threshold"))
        .count()
    )


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.farmers.models import Farmer
        from apps.programs.models import Program, ProgramStatus
        from apps.applications.models import InterventionApplication, ApplicationStatus
        from apps.distribution.models import Distribution, DistributionStatus
        from apps.inventory.models import InventoryItem

        today = timezone.now().date()

        return Response({
            "total_farmers":          Farmer.objects.filter(is_archived=False).count(),
            "active_programs":        Program.objects.filter(status=ProgramStatus.ACTIVE).count(),
            "pending_applications":   InterventionApplication.objects.filter(
                                          status__in=[ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW]
                                      ).count(),
            "distributions_today":    Distribution.objects.filter(scheduled_date=today).count(),
            "low_stock_items":        _low_stock_count(),
            "total_distributions":    Distribution.objects.count(),
            "fulfilled_applications": InterventionApplication.objects.filter(
                                          status=ApplicationStatus.FULFILLED
                                      ).count(),
        })


class StaffDashboardView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        from apps.applications.models import InterventionApplication, ApplicationStatus
        from apps.distribution.models import Distribution

        today = timezone.now().date()

        return Response({
            "pending_applications": InterventionApplication.objects.filter(
                                        status__in=[ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW]
                                    ).count(),
            "distributions_today":  Distribution.objects.filter(scheduled_date=today).count(),
            "scheduled_today":      Distribution.objects.filter(
                                        scheduled_date=today, status="SCHEDULED"
                                    ).count(),
            "delivered_today":      Distribution.objects.filter(
                                        scheduled_date=today, status="DELIVERED"
                                    ).count(),
        })
