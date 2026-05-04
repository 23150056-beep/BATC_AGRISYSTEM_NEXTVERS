from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.farmers.models import Farmer
from apps.farmers.api.serializers import (
    FarmerListSerializer, FarmerDetailSerializer, FarmerWriteSerializer
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

    @action(detail=False, methods=["get"])
    def me(self, request):
        """
        Return the farmer profile linked to the logged-in CLIENT user.
        Restricted to CLIENT — staff/admin would otherwise hit
        MultipleObjectsReturned (Finding #2).
        """
        if request.user.role != "CLIENT":
            return Response(
                {"detail": "Only CLIENT users have a personal farmer profile."},
                status=status.HTTP_403_FORBIDDEN,
            )
        farmer = (
            Farmer.objects
            .prefetch_related("parcels")
            .select_related("encoded_by", "linked_user")
            .filter(linked_user=request.user, is_archived=False)
            .first()
        )
        if farmer is None:
            return Response(
                {"detail": "No farmer profile linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(FarmerDetailSerializer(farmer).data)

    @action(detail=False, methods=["get"])
    def barangays(self, request):
        return Response(BAUANG_BARANGAYS)

    @action(detail=True, methods=["patch"])
    def archive(self, request, pk=None):
        farmer = self.get_object()
        farmer.archive()
        return Response(FarmerDetailSerializer(farmer).data)

    @action(detail=True, methods=["patch"])
    def unarchive(self, request, pk=None):
        farmer = self.get_object()
        farmer.unarchive()
        return Response(FarmerDetailSerializer(farmer).data)
