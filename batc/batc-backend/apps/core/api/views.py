from datetime import timedelta

from django.utils import timezone
from django.db.models import Sum, Subquery, OuterRef, DecimalField, Count
from django.db.models.functions import Coalesce, TruncWeek
from rest_framework.views import APIView
from rest_framework.response import Response
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


def _oldest_pending_age_days():
    """Days since the oldest currently-pending application was submitted."""
    from apps.applications.models import InterventionApplication, ApplicationStatus
    qs = (
        InterventionApplication.objects
        .filter(status__in=[ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW])
        .order_by("created_at")
        .values_list("created_at", flat=True)[:1]
    )
    earliest = next(iter(qs), None)
    if not earliest:
        return 0
    delta = timezone.now() - earliest
    return max(delta.days, 0)


def _weekly_delivered_trend(weeks: int = 8):
    """Return [{week_label, count}] for the last N ISO weeks (oldest first)."""
    from apps.distribution.models import Distribution, DistributionStatus

    today = timezone.now().date()
    # Anchor 8 weeks ago to the start of that week (Mon).
    start = today - timedelta(weeks=weeks - 1, days=today.weekday())

    rows = (
        Distribution.objects
        .filter(status=DistributionStatus.DELIVERED, scheduled_date__gte=start)
        .annotate(wk=TruncWeek("scheduled_date"))
        .values("wk")
        .annotate(count=Count("id"))
        .order_by("wk")
    )
    by_week = {r["wk"]: r["count"] for r in rows if r["wk"]}

    out = []
    for i in range(weeks):
        wk_start = start + timedelta(weeks=i)
        out.append({
            "week_label": f"W{wk_start.isocalendar().week:02d}",
            "week_start": wk_start.isoformat(),
            "count": int(by_week.get(wk_start, 0)),
        })
    return out


def _mom_delivered_delta():
    """% change in delivered distributions, current 30d vs prior 30d. None if no baseline."""
    from apps.distribution.models import Distribution, DistributionStatus

    today = timezone.now().date()
    cur_start = today - timedelta(days=29)
    prev_start = cur_start - timedelta(days=30)
    prev_end = cur_start - timedelta(days=1)

    cur = Distribution.objects.filter(
        status=DistributionStatus.DELIVERED,
        scheduled_date__gte=cur_start, scheduled_date__lte=today,
    ).count()
    prev = Distribution.objects.filter(
        status=DistributionStatus.DELIVERED,
        scheduled_date__gte=prev_start, scheduled_date__lte=prev_end,
    ).count()

    if prev == 0:
        return None if cur == 0 else 100
    return round(((cur - prev) / prev) * 100)


def _today_schedule(limit: int = 5):
    """Today's distributions, ordered by scheduled_date then id, with farmer + program info."""
    from apps.distribution.models import Distribution

    today = timezone.now().date()
    qs = (
        Distribution.objects
        .filter(scheduled_date=today)
        .select_related("program", "farmer")
        .order_by("status", "id")[:limit]
    )

    out = []
    for d in qs:
        out.append({
            "id": d.pk,
            "title": d.program.name if d.program_id else "Distribution",
            "barangay": getattr(d.farmer, "barangay", "") if d.farmer_id else "",
            "farmer_name": d.farmer.full_name if d.farmer_id else "",
            "status": d.status,
        })
    return out


def _next_distribution_today():
    sched = _today_schedule(limit=1)
    return sched[0] if sched else None


def _recent_activity(limit: int = 6):
    """Latest audit-log entries, mapped to a dashboard-friendly shape."""
    from apps.audit.models import ActionLog

    rows = (
        ActionLog.objects
        .select_related("actor")
        .order_by("-created_at")[:limit]
    )

    tone_map = {
        "APPLICATION_APPROVED":   "green",
        "APPLICATION_SUBMITTED":  "blue",
        "APPLICATION_REJECTED":   "red",
        "APPLICATION_CANCELLED":  "navy",
        "DISTRIBUTION_CREATED":   "blue",
        "DISTRIBUTION_DELIVERED": "green",
        "DISTRIBUTION_DELAYED":   "amber",
        "DISTRIBUTION_OUT_OF_STOCK": "red",
    }

    out = []
    for r in rows:
        actor_name = ""
        if r.actor_id:
            actor_name = (r.actor.get_full_name() or r.actor.username) if hasattr(r.actor, "get_full_name") else r.actor.username
        out.append({
            "id": r.pk,
            "actor": actor_name or "System",
            "action": r.action,
            "target_model": r.target_model,
            "target_id": r.target_id,
            "notes": r.notes,
            "tone": tone_map.get(r.action, "navy"),
            "created_at": r.created_at.isoformat(),
        })
    return out


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.farmers.models import Farmer
        from apps.programs.models import Program, ProgramStatus
        from apps.applications.models import InterventionApplication, ApplicationStatus
        from apps.distribution.models import Distribution, DistributionStatus
        from apps.inventory.models import InventoryItem

        today = timezone.now().date()
        first_of_month = today.replace(day=1)

        return Response({
            # Existing scalar KPIs
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
            "inventory_items":        InventoryItem.objects.count(),

            # Month-to-date delivered
            "delivered_this_month":   Distribution.objects.filter(
                                          status=DistributionStatus.DELIVERED,
                                          scheduled_date__gte=first_of_month,
                                          scheduled_date__lte=today,
                                      ).count(),

            # Attention strip details
            "oldest_pending_days":    _oldest_pending_age_days(),
            "next_distribution":      _next_distribution_today(),

            # Trend data
            "weekly_delivered_trend": _weekly_delivered_trend(weeks=8),
            "delivered_mom_pct":      _mom_delivered_delta(),

            # Detail panels
            "today_schedule":         _today_schedule(limit=5),
            "recent_activity":        _recent_activity(limit=6),
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
