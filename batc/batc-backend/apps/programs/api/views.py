from django.db.models import Count, Q

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.programs.models import Program, ProgramStatus
from apps.programs.api.serializers import (
    ProgramListSerializer, ProgramDetailSerializer, ProgramWriteSerializer
)
from apps.programs.services import get_eligible_farmers
from apps.farmers.api.serializers import FarmerListSerializer
from apps.core.permissions import IsAdmin, IsStaffOrAdmin

_VALID_TRANSITIONS = {
    ProgramStatus.DRAFT: [ProgramStatus.ACTIVE],
    ProgramStatus.ACTIVE: [ProgramStatus.SUSPENDED, ProgramStatus.COMPLETED],
    ProgramStatus.SUSPENDED: [ProgramStatus.ACTIVE, ProgramStatus.COMPLETED],
    ProgramStatus.COMPLETED: [],
}


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.prefetch_related("items", "criteria", "items__inventory_item")
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("create", "partial_update"):
            return ProgramWriteSerializer
        if self.action == "retrieve":
            return ProgramDetailSerializer
        return ProgramListSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        if self.action == "eligible_farmers":
            return [IsStaffOrAdmin()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        # Annotate counts so the list view can render progress bars without N+1.
        qs = qs.annotate(
            application_count=Count("applications", distinct=True),
            delivered_count=Count(
                "applications",
                filter=Q(applications__status="FULFILLED"),
                distinct=True,
            ),
        )
        params = self.request.query_params
        if status_filter := params.get("status"):
            qs = qs.filter(status=status_filter)
        if search := params.get("search"):
            qs = qs.filter(name__icontains=search) | qs.filter(code__icontains=search)
        if params.get("eligible_for_me") == "true" and self.request.user.is_authenticated:
            # Use Farmer.objects.filter() instead of the reverse OneToOne accessor
            # because getattr(..., None) does NOT catch RelatedObjectDoesNotExist
            # raised by Django's descriptor — it would produce a 500 for CLIENT
            # users without a linked farmer profile (m-10).
            from apps.farmers.models import Farmer
            farmer = Farmer.objects.filter(linked_user=self.request.user, is_archived=False).first()
            if farmer is None:
                return qs.none()
            from apps.programs.services import get_eligible_programs_for
            qs = qs.filter(pk__in=get_eligible_programs_for(farmer))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def _transition(self, request, pk, new_status):
        program = self.get_object()
        allowed = _VALID_TRANSITIONS.get(program.status, [])
        if new_status not in allowed:
            return Response(
                {"detail": f"Cannot move from {program.status} to {new_status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        program.status = new_status
        program.save(update_fields=["status", "updated_at"])
        return Response(ProgramDetailSerializer(program).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        return self._transition(request, pk, ProgramStatus.ACTIVE)

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        return self._transition(request, pk, ProgramStatus.SUSPENDED)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        return self._transition(request, pk, ProgramStatus.COMPLETED)

    @action(detail=True, methods=["get"], url_path="eligible-farmers")
    def eligible_farmers(self, request, pk=None):
        program = self.get_object()
        farmers = get_eligible_farmers(program)
        page = self.paginate_queryset(farmers)
        if page is not None:
            return self.get_paginated_response(FarmerListSerializer(page, many=True).data)
        return Response(FarmerListSerializer(farmers, many=True).data)
