from django.db import models
from django.db.models import Sum, Subquery, OuterRef, DecimalField
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.inventory.models import InventoryItem, StockBatch, StockMovement
from apps.inventory.api.serializers import (
    InventoryItemSerializer, StockBatchSerializer,
    StockMovementSerializer, ReceiveStockSerializer, AdjustStockSerializer,
)
from apps.inventory.services import receive_stock, adjust_stock
from apps.core.permissions import IsAdmin, IsStaffOrAdmin


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.prefetch_related("batches")
    serializer_class = InventoryItemSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "partial_update", "destroy", "receive"):
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        category = self.request.query_params.get("category")
        if search:
            qs = qs.filter(name__icontains=search)
        if category:
            qs = qs.filter(category=category)
        return qs

    def list(self, request, *args, **kwargs):
        """
        Override list() to inject the reserved_qty annotation in a single query
        so the serializer doesn't fan-out one query per row (no N+1).
        """
        response = super().list(request, *args, **kwargs)
        # The default ModelViewSet.list response is already paginated; we patch
        # reserved_qty/available_qty per row using the in-memory result list.
        from apps.inventory.selectors import get_item_reserved_map
        results = response.data.get("results") if isinstance(response.data, dict) else response.data
        if not results:
            return response
        ids = [r["id"] for r in results]
        reserved_map = get_item_reserved_map(ids)
        for row in results:
            reserved = float(reserved_map.get(row["id"], 0))
            total = float(row.get("total_stock") or 0)
            row["reserved_qty"] = reserved
            row["available_qty"] = max(0.0, total - reserved)
        return response

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def receive(self, request, pk=None):
        item = self.get_object()
        ser = ReceiveStockSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        batch = receive_stock(
            item_id=item.pk,
            lot_number=d["lot_number"],
            received_date=d["received_date"],
            expiry_date=d.get("expiry_date"),
            quantity=d["quantity"],
            created_by=request.user,
            reference_note=d.get("reference_note", ""),
        )
        return Response(StockBatchSerializer(batch).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def batches(self, request, pk=None):
        item = self.get_object()
        qs = item.batches.all().order_by("expiry_date", "received_date")
        return Response(StockBatchSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def movements(self, request, pk=None):
        item = self.get_object()
        batch_ids = item.batches.values_list("id", flat=True)
        qs = StockMovement.objects.filter(batch_id__in=batch_ids).select_related("created_by")
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(StockMovementSerializer(page, many=True).data)
        return Response(StockMovementSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """KPI summary for the inventory page header — single round-trip, no N+1."""
        from apps.distribution.models import DistributionItem
        from apps.inventory.selectors import RESERVED_DIST_STATES

        stock_subquery = Subquery(
            StockBatch.objects
            .filter(item=OuterRef("pk"), current_qty__gt=0)
            .values("item")
            .annotate(total=Sum("current_qty"))
            .values("total"),
            output_field=DecimalField(),
        )
        annotated = InventoryItem.objects.annotate(
            annotated_stock=Coalesce(stock_subquery, 0, output_field=DecimalField())
        )
        total_skus = annotated.count()
        low_stock_count = annotated.filter(
            annotated_stock__lte=models.F("low_stock_threshold")
        ).count()
        categories_count = (
            InventoryItem.objects.values("category").distinct().count()
        )
        active_batch_count = StockBatch.objects.filter(current_qty__gt=0).count()
        # Sum of in-stock units across all items (raw decimal — clients format).
        total_units = (
            StockBatch.objects.filter(current_qty__gt=0)
            .aggregate(total=Coalesce(Sum("current_qty"), 0, output_field=DecimalField()))["total"]
        )
        # Total reserved across all batches for live distributions.
        reserved_units = (
            DistributionItem.objects
            .filter(distribution__status__in=RESERVED_DIST_STATES)
            .aggregate(
                reserved=Coalesce(
                    Sum(models.F("quantity_planned") - models.F("quantity_released")),
                    0, output_field=DecimalField(),
                )
            )["reserved"]
        )
        available_units = max(0.0, float(total_units or 0) - float(reserved_units or 0))

        return Response({
            "total_skus":        total_skus,
            "low_stock_count":   low_stock_count,
            "categories_count":  categories_count,
            "active_batch_count": active_batch_count,
            "total_units":       float(total_units or 0),
            "reserved_units":    float(reserved_units or 0),
            "available_units":   available_units,
        })

    @action(detail=True, methods=["get"], url_path="usage")
    def usage(self, request, pk=None):
        """
        Return how a stock item is being used across the system:
          * Programs that include the item (with active application counts)
          * Upcoming distributions reserving units of this item
          * Per-state reservation totals
        """
        from apps.distribution.models import DistributionItem
        from apps.programs.models import ProgramItem, Program
        from apps.applications.models import InterventionApplication, ApplicationStatus
        from apps.inventory.selectors import RESERVED_DIST_STATES

        item = self.get_object()

        # Programs that include this item, with stats per program.
        program_rows = (
            ProgramItem.objects
            .filter(inventory_item_id=item.pk)
            .select_related("program")
        )
        active_app_status = (
            ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED,
        )
        programs_payload = []
        for pi in program_rows:
            p = pi.program
            active_apps = InterventionApplication.objects.filter(
                program=p, status__in=active_app_status,
            ).count()
            programs_payload.append({
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "status": p.status,
                "qty_per_beneficiary": str(pi.qty_per_beneficiary),
                "active_applications": active_apps,
            })

        # Upcoming reservations — distributions still holding stock.
        di_qs = (
            DistributionItem.objects
            .filter(
                batch__item_id=item.pk,
                distribution__status__in=RESERVED_DIST_STATES,
            )
            .select_related("distribution", "distribution__farmer", "distribution__program", "batch")
            .order_by("distribution__scheduled_date", "distribution_id")
        )
        upcoming_payload = []
        reserved_total = 0.0
        for di in di_qs[:50]:  # cap so the panel stays light
            d = di.distribution
            reserved = float(di.quantity_planned - di.quantity_released)
            reserved_total += reserved
            upcoming_payload.append({
                "distribution_id": d.id,
                "scheduled_date":  d.scheduled_date.isoformat() if d.scheduled_date else None,
                "status":          d.status,
                "farmer_name":     d.farmer.full_name if d.farmer_id else "",
                "barangay":        getattr(d.farmer, "barangay", "") if d.farmer_id else "",
                "program_code":    d.program.code if d.program_id else "",
                "program_name":    d.program.name if d.program_id else "",
                "lot_number":      di.batch.lot_number if di.batch_id else "",
                "qty_reserved":    reserved,
            })

        # If we capped the list, fall back to a SQL aggregate so the total stays accurate.
        if di_qs.count() > 50:
            agg = di_qs.aggregate(
                total=Coalesce(
                    Sum(models.F("quantity_planned") - models.F("quantity_released")),
                    0, output_field=DecimalField(),
                )
            )
            reserved_total = float(agg["total"] or 0)

        return Response({
            "item_id":          item.id,
            "programs":         programs_payload,
            "upcoming":         upcoming_payload,
            "upcoming_count":   di_qs.count(),
            "reserved_total":   reserved_total,
        })

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        # M-10: avoid N+1 by annotating total_stock in SQL instead of calling
        # the Python property (which fires a query per item).
        stock_subquery = Subquery(
            StockBatch.objects
            .filter(item=OuterRef("pk"), current_qty__gt=0)
            .values("item")
            .annotate(total=Sum("current_qty"))
            .values("total"),
            output_field=DecimalField(),
        )
        items = (
            self.get_queryset()
            .annotate(annotated_stock=Coalesce(stock_subquery, 0, output_field=DecimalField()))
            .filter(annotated_stock__lte=models.F("low_stock_threshold"))
        )
        return Response(InventoryItemSerializer(items, many=True).data)


class StockBatchViewSet(viewsets.GenericViewSet,
                        viewsets.mixins.RetrieveModelMixin,
                        viewsets.mixins.ListModelMixin):
    queryset = StockBatch.objects.select_related("item")
    serializer_class = StockBatchSerializer
    permission_classes = [IsStaffOrAdmin]

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def adjust(self, request, pk=None):
        batch = self.get_object()
        ser = AdjustStockSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            updated = adjust_stock(
                batch_id=batch.pk,
                quantity=ser.validated_data["quantity"],
                reference_note=ser.validated_data["reference_note"],
                created_by=request.user,
            )
            return Response(StockBatchSerializer(updated).data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def movements(self, request, pk=None):
        batch = self.get_object()
        qs = batch.movements.select_related("created_by")
        return Response(StockMovementSerializer(qs, many=True).data)
