from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.farmers.models import Farmer
from apps.farmers.api.serializers import (
    FarmerListSerializer, FarmerDetailSerializer, FarmerWriteSerializer,
    FarmerSelfUpdateSerializer, FarmerVerifySerializer,
)
from apps.farmers.constants import BAUANG_BARANGAYS
from apps.core.permissions import IsAdmin, IsStaffOrAdmin


class FarmerViewSet(viewsets.ModelViewSet):
    queryset = Farmer.objects.select_related("encoded_by", "linked_user").prefetch_related("parcels")
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("create", "partial_update"):
            return FarmerWriteSerializer
        if self.action == "retrieve":
            return FarmerDetailSerializer
        return FarmerListSerializer

    def get_permissions(self):
        if self.action == "me":
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        if self.action in ("archive", "unarchive"):
            return [IsAdmin()]
        if self.action == "verify":
            return [IsStaffOrAdmin()]
        return [IsStaffOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        barangay = self.request.query_params.get("barangay")
        archived = self.request.query_params.get("archived", "false")

        if search:
            qs = qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search) | qs.filter(mobile_number__icontains=search)
        if barangay:
            qs = qs.filter(barangay=barangay)
        if archived == "true":
            qs = qs.filter(is_archived=True)
        elif archived == "all":
            # Don't filter — show both active and archived farmers.
            pass
        else:
            qs = qs.filter(is_archived=False)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        """
        encoded_by  = whoever is logged in performing the create (audit trail)
        linked_user = the optional CLIENT account selected in the wizard

        Wrapped in a transaction so the serializer's validate_linked_user_id
        check and the save are atomic — prevents TOCTOU races where two requests
        race to link the same user (C-2).
        """
        from apps.accounts.models import User
        linked_id = serializer.validated_data.get("linked_user_id")
        if linked_id:
            linked_user = User.objects.select_for_update().get(pk=linked_id)
            # Re-verify no other farmer grabbed this user between validation and save
            if Farmer.objects.filter(linked_user=linked_user).exists():
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"linked_user_id": "This account is already linked to another farmer."})
        else:
            linked_user = None
        serializer.save(encoded_by=self.request.user, linked_user=linked_user)

    @transaction.atomic
    def perform_update(self, serializer):
        """
        On update, only mutate linked_user if the field was explicitly included
        in validated_data. Don't touch encoded_by — it's the original encoder.
        Wrapped in transaction for the same TOCTOU reason as perform_create (C-2).
        """
        from apps.accounts.models import User
        if "linked_user_id" in serializer.validated_data:
            linked_id = serializer.validated_data["linked_user_id"]
            if linked_id:
                linked_user = User.objects.select_for_update().get(pk=linked_id)
                # Re-verify not already linked to a *different* farmer
                existing = Farmer.objects.filter(linked_user=linked_user).exclude(pk=serializer.instance.pk)
                if existing.exists():
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({"linked_user_id": "This account is already linked to another farmer."})
            else:
                linked_user = None
            serializer.save(linked_user=linked_user)
        else:
            serializer.save()

    def _get_my_farmer(self, request):
        """Helper: resolve authenticated CLIENT's farmer profile."""
        return (
            Farmer.objects
            .prefetch_related("parcels")
            .select_related("encoded_by", "linked_user")
            .filter(linked_user=request.user, is_archived=False)
            .first()
        )

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        """
        GET  — return the farmer profile linked to the logged-in CLIENT user.
        PATCH — allow the farmer to self-update a limited set of fields
                (mobile_number, civil_status, sitio, profile_photo,
                 verification_document).

        Restricted to CLIENT role — staff/admin have no personal farmer profile
        (Finding #2).
        """
        if request.user.role != "CLIENT":
            return Response(
                {"detail": "Only CLIENT users have a personal farmer profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        farmer = self._get_my_farmer(request)
        if farmer is None:
            return Response(
                {"detail": "No farmer profile linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ctx = {"request": request}
        if request.method == "PATCH":
            serializer = FarmerSelfUpdateSerializer(
                farmer,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            farmer.refresh_from_db()
            return Response(FarmerDetailSerializer(farmer, context=ctx).data)

        return Response(FarmerDetailSerializer(farmer, context=ctx).data)

    @action(detail=False, methods=["get"])
    def barangays(self, request):
        return Response(BAUANG_BARANGAYS)

    @action(detail=True, methods=["patch"])
    def verify(self, request, pk=None):
        """Staff/admin: update a farmer's verification_status."""
        farmer = self.get_object()
        serializer = FarmerVerifySerializer(farmer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(FarmerDetailSerializer(farmer, context={"request": request}).data)

    @action(detail=True, methods=["patch"])
    def archive(self, request, pk=None):
        farmer = self.get_object()
        farmer.archive()
        return Response(FarmerDetailSerializer(farmer, context={"request": request}).data)

    @action(detail=True, methods=["patch"])
    def unarchive(self, request, pk=None):
        farmer = self.get_object()
        farmer.unarchive()
        return Response(FarmerDetailSerializer(farmer, context={"request": request}).data)
