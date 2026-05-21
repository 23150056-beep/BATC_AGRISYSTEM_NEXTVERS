from rest_framework import serializers
from apps.accounts.models import User, Role


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    # Surface the orphan state so the admin Users page can flag CLIENT
    # accounts without a linked farmer profile.
    has_farmer_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "full_name",
                  "role", "is_active", "is_archived", "date_joined", "has_farmer_profile"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_has_farmer_profile(self, obj):
        # Only meaningful for CLIENT users — short-circuit so ADMIN/STAFF rows
        # never trigger a reverse OneToOne lookup.
        if obj.role != "CLIENT":
            return None
        try:
            # `farmer_profile` is the OneToOne reverse accessor from Farmer.linked_user.
            # Accessing it raises Farmer.DoesNotExist when no row exists; catch that
            # so the serializer returns False instead of bubbling a 500.
            return obj.farmer_profile is not None and not obj.farmer_profile.is_archived
        except Exception:
            return False


class UserDetailSerializer(UserListSerializer):
    class Meta(UserListSerializer.Meta):
        fields = UserListSerializer.Meta.fields + ["last_login", "archived_at"]


class UserWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "role", "password"]
        extra_kwargs = {"password": {"write_only": True, "required": True}}

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]
        read_only_fields = fields
