import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsStaffOrAdmin
from apps.farmers.models import Farmer
from apps.distribution.models import Distribution
from apps.inventory.models import InventoryItem


class FarmersReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        qs = Farmer.objects.filter(is_archived=False).select_related()
        if b := request.query_params.get("barangay"):
            qs = qs.filter(barangay=b)
        if lh := request.query_params.get("livelihood_type"):
            qs = qs.filter(livelihood_type=lh)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="farmers.csv"'
        w = csv.writer(response)
        w.writerow(["ID", "Full Name", "Barangay", "Sitio", "Sex", "DOB", "Mobile",
                    "Livelihood", "Farm Area (ha)", "Household Size", "4Ps", "PWD", "IP",
                    "RSBSA Ref", "Registered"])
        for f in qs:
            w.writerow([
                f.pk, f.full_name, f.barangay, f.sitio, f.sex, f.dob,
                f.mobile_number, f.livelihood_type, f.farm_area_ha, f.household_size,
                f.is_4ps, f.is_pwd, f.is_ip, f.rsbsa_reference, f.created_at.date(),
            ])
        return response


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

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="distributions.csv"'
        w = csv.writer(response)
        w.writerow(["ID", "Farmer", "Barangay", "Program", "Status",
                    "Scheduled Date", "Delivered At", "Remarks"])
        for d in qs:
            w.writerow([
                d.pk, d.farmer.full_name, d.farmer.barangay, d.program.code,
                d.status, d.scheduled_date, d.delivered_at, d.remarks,
            ])
        return response


class InventoryReportView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        qs = InventoryItem.objects.all()

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="inventory.csv"'
        w = csv.writer(response)
        w.writerow(["ID", "Name", "Category", "Unit", "Total Stock", "Low Stock Threshold", "Is Low Stock", "Batches"])
        for item in qs:
            w.writerow([
                item.pk, item.name, item.category, item.unit,
                item.total_stock, item.low_stock_threshold,
                item.is_low_stock, item.batches.count(),
            ])
        return response
