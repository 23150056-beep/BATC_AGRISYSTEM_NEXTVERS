from django.db import transaction
from rest_framework import serializers
from apps.farmers.models import Farmer, FarmParcel


class FarmParcelSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmParcel
        fields = ["id", "area_ha", "commodity", "land_type", "ownership_type"]


class FarmerListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    encoded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Farmer
        fields = [
            "id", "full_name", "first_name", "last_name",
            "barangay", "mobile_number", "livelihood_type",
            "is_4ps", "is_pwd", "is_ip",
            "consent_dpa", "is_archived", "created_at",
            "encoded_by_name",
            "profile_photo", "verification_status", "is_verified",
        ]

    def get_encoded_by_name(self, obj):
        # Always show the actual encoder (staff/admin), not the linked client.
        # Previously this column accidentally displayed the client's name when
        # encoded_by got overwritten by the link operation (Finding #1).
        return obj.encoded_by.get_full_name() if obj.encoded_by else None


class FarmerDetailSerializer(FarmerListSerializer):
    parcels = FarmParcelSerializer(many=True, read_only=True)
    linked_user_id = serializers.SerializerMethodField()
    linked_user_name = serializers.SerializerMethodField()

    def get_linked_user_id(self, obj):
        return obj.linked_user_id  # the actual FK column accessor

    def get_linked_user_name(self, obj):
        return obj.linked_user.username if obj.linked_user_id else None

    class Meta(FarmerListSerializer.Meta):
        fields = FarmerListSerializer.Meta.fields + [
            "middle_name", "suffix", "sex", "dob", "civil_status",
            "highest_education", "rsbsa_reference", "sitio",
            "farm_area_ha", "household_size",
            "consent_dpa_at", "archived_at", "updated_at",
            "parcels", "linked_user_id", "linked_user_name",
            "verification_document",
        ]


class FarmerWriteSerializer(serializers.ModelSerializer):
    parcels = FarmParcelSerializer(many=True, required=False)
    linked_user_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Farmer
        fields = [
            "first_name", "middle_name", "last_name", "suffix",
            "sex", "dob", "civil_status", "highest_education",
            "mobile_number", "is_4ps", "is_pwd", "is_ip",
            "rsbsa_reference", "barangay", "sitio",
            "livelihood_type", "farm_area_ha", "household_size",
            "consent_dpa", "parcels", "linked_user_id",
            "profile_photo", "verification_document",
            "verification_status", "is_verified",
        ]

    # ------------------------------------------------------------------
    # Field-level validators
    # ------------------------------------------------------------------
    def validate_rsbsa_reference(self, value):
        if not value or not value.strip():
            return None  # store blank as NULL — avoids unique-constraint clash
        qs = Farmer.objects.filter(rsbsa_reference=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "This RSBSA reference number is already registered to another farmer."
            )
        return value

    def validate_mobile_number(self, value):
        """
        Normalize Philippine mobile numbers to canonical +63 form (Finding #15).

        Accepts: 09171234567, 9171234567, +639171234567, 639171234567
        Stores : +639171234567
        """
        if not value:
            return value
        digits = "".join(ch for ch in value if ch.isdigit())
        if digits.startswith("63") and len(digits) == 12:
            canonical = "+" + digits
        elif digits.startswith("9") and len(digits) == 10:
            canonical = "+63" + digits
        elif digits.startswith("0") and len(digits) == 11:
            canonical = "+63" + digits[1:]
        else:
            raise serializers.ValidationError(
                "Mobile number must be a valid Philippine number (e.g. 09171234567 or +639171234567)."
            )

        # Cross-format duplicate check
        qs = Farmer.objects.filter(mobile_number=canonical)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "This mobile number is already registered to another farmer."
            )
        return canonical

    def validate_consent_dpa(self, value):
        if not value:
            raise serializers.ValidationError(
                "Data Privacy Act consent is required to register a farmer."
            )
        return value

    def validate_linked_user_id(self, value):
        if value is None:
            return value
        from apps.accounts.models import User
        try:
            user = User.objects.get(pk=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User account not found.")
        if user.role != "CLIENT":
            raise serializers.ValidationError(
                "Only CLIENT-role accounts can be linked to a farmer profile."
            )
        # Use the new linked_user FK (Finding #1) instead of encoded_farmers
        existing = Farmer.objects.filter(linked_user=user)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError(
                "This user is already linked to a farmer profile."
            )
        return value

    # ------------------------------------------------------------------
    # Create / Update
    # ------------------------------------------------------------------
    def create(self, validated_data):
        parcels_data = validated_data.pop("parcels", [])
        # linked_user_id and encoded_by are passed in via the view's perform_create as kwargs;
        # they arrive in validated_data after `serializer.save(...)`. We pop linked_user_id
        # because the view translated it into a User instance set on `linked_user`.
        validated_data.pop("linked_user_id", None)
        farmer = Farmer.objects.create(**validated_data)
        for p in parcels_data:
            FarmParcel.objects.create(farmer=farmer, **p)
        return farmer

    def update(self, instance, validated_data):
        parcels_data = validated_data.pop("parcels", None)
        validated_data.pop("linked_user_id", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Diff parcels by ID instead of nuking them all (Finding #14)
        if parcels_data is not None:
            existing = {p.id: p for p in instance.parcels.all()}
            seen_ids = set()
            for p_data in parcels_data:
                pid = p_data.get("id")
                if pid and pid in existing:
                    parcel = existing[pid]
                    for attr, value in p_data.items():
                        if attr == "id":
                            continue
                        setattr(parcel, attr, value)
                    parcel.save()
                    seen_ids.add(pid)
                else:
                    payload = {k: v for k, v in p_data.items() if k != "id"}
                    FarmParcel.objects.create(farmer=instance, **payload)
            for pid, parcel in existing.items():
                if pid not in seen_ids:
                    parcel.delete()
        return instance


# ---------------------------------------------------------------------------
# Self-registration
# ---------------------------------------------------------------------------

class FarmerSelfRegistrationSerializer(FarmerWriteSerializer):
    """
    Public serializer used by the farmer self-registration endpoint.

    Differences from FarmerWriteSerializer:
    - Adds `username`, `password`, `confirm_password` for account creation.
    - Removes `linked_user_id` — the new user IS the linked account.
    - `create()` atomically creates both the User account and the Farmer profile.
    - `encoded_by` is left NULL (no staff encoder for self-registrations).
    """

    username         = serializers.CharField(max_length=150, write_only=True)
    password         = serializers.CharField(
        min_length=8, write_only=True, style={"input_type": "password"}
    )
    confirm_password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    class Meta(FarmerWriteSerializer.Meta):
        fields = (
            [f for f in FarmerWriteSerializer.Meta.fields if f != "linked_user_id"]
            + ["username", "password", "confirm_password"]
        )

    # ------------------------------------------------------------------
    # Validators
    # ------------------------------------------------------------------

    def validate_username(self, value):
        from apps.accounts.models import User
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "This username is already taken. Please choose another."
            )
        return value

    def validate(self, attrs):
        """Cross-field: password match + Django's password strength validators."""
        password = attrs.get("password")
        confirm  = attrs.pop("confirm_password", None)  # remove — not stored
        if password != confirm:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        # Run Django's built-in password validators (length, common-password, etc.)
        try:
            from django.contrib.auth.password_validation import validate_password
            from django.core.exceptions import ValidationError as DjangoValidationError
            validate_password(password)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    @transaction.atomic
    def create(self, validated_data):
        from apps.accounts.models import User, Role

        username     = validated_data.pop("username")
        password     = validated_data.pop("password")
        parcels_data = validated_data.pop("parcels", [])
        # linked_user_id is not in our fields; pop defensively just in case
        validated_data.pop("linked_user_id", None)

        # 1. Create the CLIENT user account
        user = User(username=username, role=Role.CLIENT)
        user.set_password(password)
        user.save()

        # 2. Create the Farmer profile linked to the new user
        farmer = Farmer.objects.create(
            **validated_data,
            linked_user=user,
            encoded_by=None,  # self-registered — no staff encoder
        )
        for p in parcels_data:
            FarmParcel.objects.create(farmer=farmer, **p)

        return farmer, user


# ---------------------------------------------------------------------------
# Farmer self-registration — now accepts optional verification_document
# ---------------------------------------------------------------------------
# The base FarmerSelfRegistrationSerializer already inherits FarmerWriteSerializer
# which now includes verification_document; mark it not required so the demo
# registration flow works without forcing an upload.
FarmerSelfRegistrationSerializer.Meta.fields = (
    [f for f in FarmerSelfRegistrationSerializer.Meta.fields]
)


# ---------------------------------------------------------------------------
# Self-update (CLIENT portal: limited fields only)
# ---------------------------------------------------------------------------

class FarmerSelfUpdateSerializer(serializers.ModelSerializer):
    """
    Used when a CLIENT farmer updates their own profile via PATCH /api/farmers/me/.

    Restricted to fields the farmer can safely edit themselves:
    - Contact & personal basics
    - Profile photo (canvas-compressed JPEG uploaded by client)
    - Verification document upload (triggers status → PENDING)

    Staff-only fields (barangay, rsbsa_reference, is_4ps, etc.) are excluded.
    """

    class Meta:
        model = Farmer
        fields = [
            "mobile_number",
            "civil_status",
            "sitio",
            "profile_photo",
            "verification_document",
        ]

    def validate_mobile_number(self, value):
        if not value:
            return value
        digits = "".join(ch for ch in value if ch.isdigit())
        if digits.startswith("63") and len(digits) == 12:
            canonical = "+" + digits
        elif digits.startswith("9") and len(digits) == 10:
            canonical = "+63" + digits
        elif digits.startswith("0") and len(digits) == 11:
            canonical = "+63" + digits[1:]
        else:
            raise serializers.ValidationError(
                "Mobile number must be a valid Philippine number (e.g. 09171234567)."
            )
        qs = Farmer.objects.filter(mobile_number=canonical).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "This mobile number is already registered to another farmer."
            )
        return canonical

    def update(self, instance, validated_data):
        # If farmer uploads a verification document, reset status to PENDING
        if "verification_document" in validated_data and validated_data["verification_document"]:
            from apps.farmers.models import VerificationStatus
            instance.verification_status = VerificationStatus.PENDING
            instance.is_verified = False
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ---------------------------------------------------------------------------
# Staff verification action serializer
# ---------------------------------------------------------------------------

class FarmerVerifySerializer(serializers.ModelSerializer):
    """Minimal serializer for staff/admin to update verification_status."""

    class Meta:
        model = Farmer
        fields = ["verification_status", "is_verified"]

    def update(self, instance, validated_data):
        from apps.farmers.models import VerificationStatus
        status = validated_data.get("verification_status", instance.verification_status)
        instance.verification_status = status
        instance.is_verified = (status == VerificationStatus.VERIFIED)
        instance.save(update_fields=["verification_status", "is_verified", "updated_at"])
        return instance
