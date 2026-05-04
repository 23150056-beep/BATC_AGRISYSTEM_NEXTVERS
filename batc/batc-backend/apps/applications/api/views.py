from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsStaffOrAdmin, IsAdmin
from apps.applications.models import InterventionApplication, ApplicationStatus
from apps.applications.api.serializers import ApplicationListSerializer, ApplicationWriteSerializer, RejectSerializer
from apps.applications import services


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = InterventionApplication.objects.select_related(
        "farmer", "program", "reviewed_by"
    ).all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create",):
            return ApplicationWriteSerializer
        return ApplicationListSerializer

    def get_permissions(self):
        if self.action in ("create", "mine", "cancel"):
            return [IsAuthenticated()]
        if self.action in ("approve", "reject"):
            return [IsStaffOrAdmin()]
        if self.action in ("destroy", "update", "partial_update"):
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Clients only see their own applications. Use linked_user (Finding #1).
        if user.is_client:
            qs = qs.filter(farmer__linked_user=user)
        params = self.request.query_params
        if s := params.get("status"):
            qs = qs.filter(status=s)
        if p := params.get("program"):
            qs = qs.filter(program_id=p)
        if f := params.get("farmer"):
            qs = qs.filter(farmer_id=f)
        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        app = services.submit_application(
            farmer=data["farmer"],
            program=data["program"],
            by_user=self.request.user,
        )
        return app

    def create(self, request, *args, **kwargs):
        ser = ApplicationWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            app = self.perform_create(ser)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ApplicationListSerializer(app).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        app = self.get_object()
        try:
            app = services.approve_application(app, reviewed_by=request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ApplicationListSerializer(app).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        app = self.get_object()
        ser = RejectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            app = services.reject_application(app, reason=ser.validated_data["reason"], reviewed_by=request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ApplicationListSerializer(app).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        app = self.get_object()
        try:
            app = services.cancel_application(app, by_user=request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ApplicationListSerializer(app).data)

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        """Client: own applications."""
        if not request.user.is_client:
            return Response({"detail": "Clients only."}, status=status.HTTP_403_FORBIDDEN)
        # Use linked_user (Finding #20). encoded_farmers used to silently miss
        # seeded farmers whose linkage was set via encoded_by.
        qs = (
            InterventionApplication.objects
            .filter(farmer__linked_user=request.user, farmer__is_archived=False)
            .select_related("farmer", "program", "reviewed_by")
        )
        ser = ApplicationListSerializer(qs, many=True)
        return Response(ser.data)
