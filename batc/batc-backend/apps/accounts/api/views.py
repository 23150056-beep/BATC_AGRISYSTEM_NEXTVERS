from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.api.serializers import (
    UserListSerializer, UserDetailSerializer, UserWriteSerializer, UserMeSerializer
)
from apps.core.permissions import IsAdmin, IsStaffOrAdmin


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    throttle_scope = "login"  # Limits failed/successful logins to 5/min per IP


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Surface real failures instead of swallowing them (Finding #22).
        # Frontend bugs that forget to send the refresh token used to look
        # successful, leaving the token usable until expiry.
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except Exception as e:
            return Response(
                {"detail": f"Could not invalidate token: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Logged out."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserMeSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    # select_related on the reverse OneToOne (farmer_profile) so the
    # has_farmer_profile serializer field doesn't N+1 across the user list.
    queryset = User.objects.select_related("farmer_profile").all().order_by("username")
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("create", "partial_update"):
            return UserWriteSerializer
        if self.action == "retrieve":
            return UserDetailSerializer
        return UserListSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffOrAdmin()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if role := params.get("role"):
            qs = qs.filter(role=role)
        if search := params.get("search"):
            qs = qs.filter(username__icontains=search) | qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search)
        if params.get("available_for_link") == "true":
            # CLIENT users not yet linked to a farmer (used by Register Farmer wizard).
            # Use the new `farmer_profile` reverse FK from Farmer.linked_user (Finding #1).
            from django.db.models import Q
            base_q = Q(role="CLIENT", is_archived=False, farmer_profile__isnull=True)
            include_id = params.get("include_user_id")
            if include_id:
                try:
                    base_q |= Q(pk=int(include_id))
                except (ValueError, TypeError):
                    pass
            qs = qs.filter(base_q)
        return qs

    def partial_update(self, request, *args, **kwargs):
        # Staff cannot change role or archive status
        if request.user.role != "ADMIN":
            request.data.pop("role", None)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["patch"], permission_classes=[IsAdmin])
    def archive(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({"detail": "Cannot archive yourself."}, status=status.HTTP_400_BAD_REQUEST)
        user.archive()
        return Response(UserDetailSerializer(user).data)

    @action(detail=True, methods=["patch"], permission_classes=[IsAdmin])
    def unarchive(self, request, pk=None):
        user = self.get_object()
        user.unarchive()
        return Response(UserDetailSerializer(user).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin], url_path="reset-password")
    def reset_password(self, request, pk=None):
        user = self.get_object()
        default_password = "farmer1234"
        user.set_password(default_password)
        user.save(update_fields=["password"])
        return Response({"temp_password": default_password})


class FarmerSelfRegistrationView(APIView):
    """
    Public endpoint: a farmer creates their own account + farmer profile in one
    atomic request.

    POST /api/v1/auth/register/

    On success returns { access, refresh, user, farmer } so the frontend can
    immediately log the farmer in without a second round-trip.

    Throttled to 10 attempts per hour per IP to deter automated abuse.
    """

    permission_classes = [AllowAny]
    throttle_scope = "registration"

    def post(self, request):
        from apps.farmers.api.serializers import (
            FarmerSelfRegistrationSerializer,
            FarmerDetailSerializer,
        )

        ser = FarmerSelfRegistrationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        farmer, user = ser.save()

        # Issue JWT tokens so the farmer is immediately logged in
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access":  str(refresh.access_token),
                "refresh": str(refresh),
                "user":    UserMeSerializer(user).data,
                "farmer":  FarmerDetailSerializer(farmer, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
