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
