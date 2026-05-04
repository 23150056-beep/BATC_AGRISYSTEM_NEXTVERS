from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsStaffOrAdmin, IsAdmin
from apps.distribution.models import Distribution
from apps.distribution.api.serializers import (
    DistributionListSerializer, StatusUpdateSerializer, BulkAllocateSerializer
)
from apps.distribution import services


class DistributionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Distribution.objects.select_related(
        "application", "program", "farmer", "updated_by"
    ).prefetch_related("items__batch__item").all()
    serializer_class = DistributionListSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if s := params.get("status"):
            qs = qs.filter(status=s)
        if p := params.get("program"):
            qs = qs.filter(program_id=p)
        if f := params.get("farmer"):
            qs = qs.filter(farmer_id=f)
        if date := params.get("scheduled_date"):
            qs = qs.filter(scheduled_date=date)
        return qs

    @action(detail=True, methods=["post"], url_path="update-status")
    def update_status(self, request, pk=None):
        distribution = self.get_object()
        ser = StatusUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Pass scheduled_date through to services.update_status — the prior
        # implementation persisted it BEFORE the transition guard, which left
        # the new date saved even when the API responded 400 (Finding #5).
        try:
            dist = services.update_status(
                distribution=distribution,
                new_status=d["new_status"],
                remarks=d["remarks"],
                by_user=request.user,
                scheduled_date=d.get("scheduled_date") or None,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(DistributionListSerializer(dist).data)

    @action(detail=False, methods=["post"], url_path="bulk-reschedule", permission_classes=[IsAdmin])
    def bulk_reschedule(self, request):
        """
        Bulk-update scheduled_date on existing distributions for a program.

        Replaces the old `bulk_allocate` action which was effectively dead code:
        approve_application already auto-creates a Distribution, so the
        "approved-but-not-distributed" filter always returned an empty set
        (Finding #4). This endpoint serves the actual demo need — quickly set
        a pickup date for everyone in a program.
        """
        ser = BulkAllocateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        from apps.programs.models import Program
        try:
            program = Program.objects.get(pk=d["program_id"])
        except Program.DoesNotExist:
            return Response({"detail": "Program not found."}, status=status.HTTP_404_NOT_FOUND)

        scheduled_date = d.get("scheduled_date")
        if not scheduled_date:
            return Response(
                {"detail": "scheduled_date is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.distribution.models import DistributionStatus
        # Only update SCHEDULED/RESCHEDULED/DELAYED — never overwrite delivered ones
        qs = Distribution.objects.filter(
            program=program,
            status__in=[
                DistributionStatus.SCHEDULED,
                DistributionStatus.RESCHEDULED,
                DistributionStatus.DELAYED,
            ],
        )
        updated = qs.update(scheduled_date=scheduled_date)
        return Response({"updated": updated})

    @action(detail=False, methods=["get"], url_path="mine", permission_classes=[IsAuthenticated])
    def mine(self, request):
        """Client: own distributions."""
        if not request.user.is_client:
            return Response({"detail": "Clients only."}, status=status.HTTP_403_FORBIDDEN)
        # Use linked_user (Finding #20)
        qs = Distribution.objects.filter(
            farmer__linked_user=request.user,
            farmer__is_archived=False,
        ).select_related("program", "farmer").prefetch_related("items__batch__item")
        return Response(DistributionListSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="confirm-receipt", permission_classes=[IsAuthenticated])
    def confirm_receipt(self, request, pk=None):
        """Client: confirm they received their distribution."""
        if not request.user.is_client:
            return Response({"detail": "Clients only."}, status=status.HTTP_403_FORBIDDEN)

        # Ensure the distribution belongs to this farmer (via linked_user — Finding #20)
        try:
            distribution = Distribution.objects.get(
                pk=pk,
                farmer__linked_user=request.user,
            )
        except Distribution.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if distribution.status not in ("SCHEDULED", "RESCHEDULED", "DELAYED"):
            return Response(
                {"detail": f"Cannot confirm receipt when status is '{distribution.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            dist = services.update_status(
                distribution=distribution,
                new_status="DELIVERED",
                remarks="Confirmed received by farmer.",
                by_user=request.user,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DistributionListSerializer(dist).data)
