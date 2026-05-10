"""
Reports API.

Each CSV view supports:
- Optional ?date_from=YYYY-MM-DD and ?date_to=YYYY-MM-DD filters
- ?count=true returns JSON {count: N} instead of streaming the CSV (preview)
- A metadata header row prefixed with "# " describing filters + timestamp,
  so spreadsheets that ignore "#" lines still work, and ops folks can verify
  exactly what was exported.
"""
import csv
from datetime import datetime, timedelta
from django.db.models import Avg, Count, Sum, Q
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsStaffOrAdmin
from apps.farmers.models import Farmer
from apps.distribution.models import Distribution
from apps.applications.models import InterventionApplication
from apps.inventory.models import InventoryItem
from apps.feedback.models import Feedback, QUALITY_ISSUE_TYPES
from apps.programs.models import Program


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _parse_date(value):
    """Return a date or None. Tolerant of empty/invalid input."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _apply_range(qs, request, date_field):
    """Apply ?date_from / ?date_to filters on `date_field`. Returns (qs, df, dt)."""
    df = _parse_date(request.query_params.get("date_from"))
    dt = _parse_date(request.query_params.get("date_to"))
    if df:
        qs = qs.filter(**{f"{date_field}__gte": df})
    if dt:
        qs = qs.filter(**{f"{date_field}__lte": dt})
    return qs, df, dt


def _wants_count(request):
    return request.query_params.get("count") == "true"


def _csv_response(filename: str, header: list, rows, meta: dict | None = None):
    """Build a CSV HttpResponse with optional metadata banner."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    w = csv.writer(response)
    if meta:
        w.writerow([f"# Generated: {timezone.now().isoformat(timespec='seconds')}"])
        for k, v in meta.items():
            if v not in (None, "", []):
                w.writerow([f"# {k}: {v}"])
        w.writerow([])
    w.writerow(header)
    for row in rows:
        w.writerow(row)
    return response


# ---------------------------------------------------------------------------
# Summary / KPI endpoint — used by frontend ReportSummaryCards.
# ---------------------------------------------------------------------------

class ReportSummaryView(APIView):
    """
    Returns aggregated metrics for the reports landing page.
    Date filters apply where they make sense (distributions, applications, feedback).
    """
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        df = _parse_date(request.query_params.get("date_from"))
        dt = _parse_date(request.query_params.get("date_to"))

        # Default window: last 30 days inclusive when nothing specified — gives
        # a useful at-a-glance number rather than "all time" totals.
        if not df and not dt:
            dt = timezone.localdate()
            df = dt - timedelta(days=30)

        # ---- farmers (no date filter — registered profiles are static stock)
        farmers_qs = Farmer.objects.filter(is_archived=False)
        livelihood_breakdown = list(
            farmers_qs.values("livelihood_type")
                      .annotate(count=Count("id"))
                      .order_by("-count")
        )
        barangay_breakdown = list(
            farmers_qs.values("barangay")
                      .annotate(count=Count("id"))
                      .order_by("-count")[:10]
        )

        # ---- distributions in window
        dist_qs = Distribution.objects.all()
        if df:
            dist_qs = dist_qs.filter(scheduled_date__gte=df)
        if dt:
            dist_qs = dist_qs.filter(scheduled_date__lte=dt)
        dist_status_breakdown = list(
            dist_qs.values("status").annotate(count=Count("id")).order_by("-count")
        )
        delivered_count = dist_qs.filter(status="DELIVERED").count()
        scheduled_count = dist_qs.filter(status="SCHEDULED").count()
        delayed_count   = dist_qs.filter(status__in=["DELAYED", "RESCHEDULED"]).count()

        # ---- daily distribution trend (delivered) for chart
        # Group by scheduled_date — gives a clean time-series.
        from django.db.models.functions import TruncDate
        delivered_trend = list(
            dist_qs.filter(status="DELIVERED")
                   .annotate(day=TruncDate("scheduled_date"))
                   .values("day")
                   .annotate(count=Count("id"))
                   .order_by("day")
        )

        # ---- applications in window
        app_qs = InterventionApplication.objects.all()
        if df:
            app_qs = app_qs.filter(submitted_at__date__gte=df)
        if dt:
            app_qs = app_qs.filter(submitted_at__date__lte=dt)
        app_status_breakdown = list(
            app_qs.values("status").annotate(count=Count("id")).order_by("-count")
        )
        approval_rate = None
        decided = app_qs.filter(status__in=["APPROVED", "REJECTED", "FULFILLED"]).count()
        if decided:
            approved = app_qs.filter(status__in=["APPROVED", "FULFILLED"]).count()
            approval_rate = round(approved / decided * 100, 1)

        # ---- feedback in window
        fb_qs = Feedback.objects.all()
        if df:
            fb_qs = fb_qs.filter(created_at__date__gte=df)
        if dt:
            fb_qs = fb_qs.filter(created_at__date__lte=dt)
        avg_rating = fb_qs.aggregate(v=Avg("rating"))["v"]
        quality_issues = fb_qs.filter(issue_type__in=list(QUALITY_ISSUE_TYPES)).count()

        # ---- inventory (current state)
        inv_qs = InventoryItem.objects.all()
        low_stock = sum(1 for i in inv_qs if i.is_low_stock)

        return Response({
            "window": {"date_from": df.isoformat() if df else None,
                       "date_to":   dt.isoformat() if dt else None},
            "totals": {
                "farmers":            farmers_qs.count(),
                "active_programs":    Program.objects.filter(status="ACTIVE").count(),
                "distributions":      dist_qs.count(),
                "delivered":          delivered_count,
                "scheduled":          scheduled_count,
                "delayed":            delayed_count,
                "applications":       app_qs.count(),
                "approval_rate":      approval_rate,    # null if no decisions
                "feedback_count":     fb_qs.count(),
                "avg_rating":         round(avg_rating, 2) if avg_rating else None,
                "quality_issues":     quality_issues,
                "inventory_items":    inv_qs.count(),
                "low_stock_items":    low_stock,
            },
            "distribution_status_breakdown": dist_status_breakdown,
            "application_status_breakdown":  app_status_breakdown,
            "livelihood_breakdown":          livelihood_breakdown,
            "barangay_breakdown":            barangay_breakdown,
            "delivered_trend":               [
                {"day": r["day"].isoformat() if r["day"] else None, "count": r["count"]}
                for r in delivered_trend
            ],
        })


# ---------------------------------------------------------------------------
# CSV exports
# ---------------------------------------------------------------------------

class FarmersReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        qs = Farmer.objects.filter(is_archived=False)
        if b := request.query_params.get("barangay"):
            qs = qs.filter(barangay=b)
        if lh := request.query_params.get("livelihood_type"):
            qs = qs.filter(livelihood_type=lh)
        # Optional registration-date range
        qs, df, dt = _apply_range(qs, request, "created_at__date")

        if _wants_count(request):
            return JsonResponse({"count": qs.count()})

        meta = {
            "Report":     "Farmers",
            "Barangay":   request.query_params.get("barangay"),
            "Livelihood": request.query_params.get("livelihood_type"),
            "Date From":  df.isoformat() if df else None,
            "Date To":    dt.isoformat() if dt else None,
            "Total Rows": qs.count(),
        }
        header = ["ID", "Full Name", "Barangay", "Sitio", "Sex", "DOB", "Mobile",
                  "Livelihood", "Farm Area (ha)", "Household Size", "4Ps", "PWD", "IP",
                  "RSBSA Ref", "Registered"]
        rows = (
            [f.pk, f.full_name, f.barangay, f.sitio, f.sex, f.dob,
             f.mobile_number, f.livelihood_type, f.farm_area_ha, f.household_size,
             "Yes" if f.is_4ps else "No", "Yes" if f.is_pwd else "No",
             "Yes" if f.is_ip else "No", f.rsbsa_reference, f.created_at.date()]
            for f in qs
        )
        return _csv_response("farmers.csv", header, rows, meta)


class DistributionsReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        qs = Distribution.objects.select_related("farmer", "program", "application")
        if s := request.query_params.get("status"):
            qs = qs.filter(status=s)
        if d := request.query_params.get("scheduled_date"):
            qs = qs.filter(scheduled_date=d)
        if p := request.query_params.get("program"):
            qs = qs.filter(program_id=p)
        qs, df, dt = _apply_range(qs, request, "scheduled_date")

        if _wants_count(request):
            return JsonResponse({"count": qs.count()})

        meta = {
            "Report":         "Distributions",
            "Status":         request.query_params.get("status"),
            "Program":        request.query_params.get("program"),
            "Scheduled Date": request.query_params.get("scheduled_date"),
            "Date From":      df.isoformat() if df else None,
            "Date To":        dt.isoformat() if dt else None,
            "Total Rows":     qs.count(),
        }
        header = ["ID", "Farmer", "Barangay", "Program Code", "Program Name",
                  "Status", "Scheduled Date", "Delivered At", "Items", "Remarks"]
        rows = (
            [d.pk, d.farmer.full_name, d.farmer.barangay, d.program.code, d.program.name,
             d.status, d.scheduled_date,
             d.delivered_at.isoformat() if d.delivered_at else "",
             d.items.count(), d.remarks]
            for d in qs
        )
        return _csv_response("distributions.csv", header, rows, meta)


class InventoryReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        qs = InventoryItem.objects.all()
        if cat := request.query_params.get("category"):
            qs = qs.filter(category=cat)
        only_low = request.query_params.get("only_low_stock") == "true"

        items = list(qs)
        if only_low:
            items = [i for i in items if i.is_low_stock]

        if _wants_count(request):
            return JsonResponse({"count": len(items)})

        meta = {
            "Report":         "Inventory",
            "Category":       request.query_params.get("category"),
            "Low stock only": "Yes" if only_low else None,
            "Total Rows":     len(items),
        }
        header = ["ID", "Name", "Category", "Unit", "Total Stock",
                  "Low Stock Threshold", "Is Low Stock", "Batches"]
        rows = (
            [i.pk, i.name, i.category, i.unit, i.total_stock,
             i.low_stock_threshold,
             "Yes" if i.is_low_stock else "No", i.batches.count()]
            for i in items
        )
        return _csv_response("inventory.csv", header, rows, meta)


class ApplicationsReportView(APIView):
    """Application activity log — useful for compliance / approval audits."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        qs = InterventionApplication.objects.select_related(
            "farmer", "program", "reviewed_by"
        )
        if s := request.query_params.get("status"):
            qs = qs.filter(status=s)
        if p := request.query_params.get("program"):
            qs = qs.filter(program_id=p)
        qs, df, dt = _apply_range(qs, request, "submitted_at__date")

        if _wants_count(request):
            return JsonResponse({"count": qs.count()})

        meta = {
            "Report":     "Applications",
            "Status":     request.query_params.get("status"),
            "Program":    request.query_params.get("program"),
            "Date From":  df.isoformat() if df else None,
            "Date To":    dt.isoformat() if dt else None,
            "Total Rows": qs.count(),
        }
        header = ["ID", "Farmer", "Barangay", "Program Code", "Program Name",
                  "Status", "Submitted", "Reviewed", "Reviewer", "Rejection Reason"]
        rows = (
            [a.pk, a.farmer.full_name, a.farmer.barangay, a.program.code, a.program.name,
             a.status,
             a.submitted_at.isoformat(timespec="seconds") if a.submitted_at else "",
             a.reviewed_at.isoformat(timespec="seconds") if a.reviewed_at else "",
             a.reviewed_by.username if a.reviewed_by else "",
             a.rejection_reason]
            for a in qs
        )
        return _csv_response("applications.csv", header, rows, meta)


class FeedbackReportView(APIView):
    """Quality / satisfaction feedback log — for monitoring program impact."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        qs = Feedback.objects.select_related("farmer", "distribution__program")
        if s := request.query_params.get("status"):
            qs = qs.filter(status=s)
        if it := request.query_params.get("issue_type"):
            qs = qs.filter(issue_type=it)
        # Quality issues only
        if request.query_params.get("quality_only") == "true":
            qs = qs.filter(issue_type__in=list(QUALITY_ISSUE_TYPES))
        qs, df, dt = _apply_range(qs, request, "created_at__date")

        if _wants_count(request):
            return JsonResponse({"count": qs.count()})

        meta = {
            "Report":        "Feedback",
            "Status":        request.query_params.get("status"),
            "Issue Type":    request.query_params.get("issue_type"),
            "Quality only":  "Yes" if request.query_params.get("quality_only") == "true" else None,
            "Date From":     df.isoformat() if df else None,
            "Date To":       dt.isoformat() if dt else None,
            "Total Rows":    qs.count(),
        }
        header = ["ID", "Farmer", "Program", "Issue Type", "Rating", "Status",
                  "Comment", "Created"]
        rows = (
            [fb.pk, fb.farmer.full_name,
             fb.distribution.program.name if fb.distribution and fb.distribution.program else "",
             fb.issue_type, fb.rating, fb.status,
             fb.comment, fb.created_at.isoformat(timespec="seconds")]
            for fb in qs
        )
        return _csv_response("feedback.csv", header, rows, meta)
