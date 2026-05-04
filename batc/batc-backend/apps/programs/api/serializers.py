from rest_framework import serializers
from apps.programs.models import Program, ProgramItem, EligibilityCriterion
from apps.inventory.api.serializers import InventoryItemSerializer


class EligibilityCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EligibilityCriterion
        fields = ["id", "field", "operator", "value", "fail_message"]

    # Field <-> operator coherence (Finding #16). Without this validator, the
    # admin can save e.g. (field=livelihood_type, operator=is_true) and the
    # eligibility evaluator silently returns 0 farmers with no error.
    BOOLEAN_FIELDS = {"is_4ps", "is_pwd", "is_ip"}
    NUMERIC_FIELDS = {"farm_area_ha", "household_size"}
    STRING_FIELDS  = {"livelihood_type"}

    def validate(self, attrs):
        field = attrs.get("field") or (self.instance and self.instance.field)
        op    = attrs.get("operator") or (self.instance and self.instance.operator)
        value = attrs.get("value", "" if self.instance is None else self.instance.value)

        if field in self.BOOLEAN_FIELDS and op != "is_true":
            raise serializers.ValidationError({
                "operator": f"Boolean field '{field}' only supports the 'is_true' operator."
            })
        if field in self.NUMERIC_FIELDS and op not in ("gte", "lte", "eq"):
            raise serializers.ValidationError({
                "operator": f"Numeric field '{field}' only supports 'gte', 'lte', or 'eq'."
            })
        if field in self.STRING_FIELDS and op != "eq":
            raise serializers.ValidationError({
                "operator": f"String field '{field}' only supports the 'eq' operator."
            })
        if op in ("eq", "gte", "lte") and not str(value).strip():
            raise serializers.ValidationError({
                "value": f"A non-empty value is required for the '{op}' operator."
            })
        if op in ("gte", "lte"):
            try:
                from decimal import Decimal
                Decimal(str(value))
            except Exception:
                raise serializers.ValidationError({
                    "value": f"Value for '{op}' must be numeric."
                })
        return attrs


class ProgramItemSerializer(serializers.ModelSerializer):
    inventory_item_detail = InventoryItemSerializer(source="inventory_item", read_only=True)

    class Meta:
        model = ProgramItem
        fields = ["id", "inventory_item", "inventory_item_detail", "qty_per_beneficiary", "max_per_farmer"]


class ProgramListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = [
            "id", "name", "code", "source_agency", "status",
            "start_date", "end_date", "target_barangays",
            "item_count", "created_at",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class ProgramDetailSerializer(ProgramListSerializer):
    items = ProgramItemSerializer(many=True, read_only=True)
    criteria = EligibilityCriterionSerializer(many=True, read_only=True)
    # M-4: eligible_farmer_count is computed per-program by running ALL eligibility
    # criteria as DB filters — one extra query per program in the list endpoint.
    # Move it to the detail serializer so it only runs for a single program at a time.
    eligible_farmer_count = serializers.SerializerMethodField()

    class Meta(ProgramListSerializer.Meta):
        fields = ProgramListSerializer.Meta.fields + [
            "items", "criteria", "eligible_farmer_count", "updated_at",
        ]

    def get_eligible_farmer_count(self, obj):
        from apps.programs.services import get_eligible_farmers
        return get_eligible_farmers(obj).count()


class ProgramWriteSerializer(serializers.ModelSerializer):
    items = ProgramItemSerializer(many=True, required=False)
    criteria = EligibilityCriterionSerializer(many=True, required=False)

    class Meta:
        model = Program
        fields = [
            "name", "code", "source_agency", "start_date", "end_date",
            "target_barangays", "items", "criteria",
        ]

    def _save_nested(self, program, items_data, criteria_data):
        if items_data is not None:
            program.items.all().delete()
            for item in items_data:
                ProgramItem.objects.create(program=program, **item)
        if criteria_data is not None:
            program.criteria.all().delete()
            for c in criteria_data:
                EligibilityCriterion.objects.create(program=program, **c)

    def validate(self, attrs):
        # m-17: ensure end_date is not before start_date.
        # Use instance values as fallback for PATCH requests that only send one field.
        start = attrs.get("start_date") or (self.instance and self.instance.start_date)
        end   = attrs.get("end_date")   or (self.instance and self.instance.end_date)
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after the start date."}
            )
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        criteria_data = validated_data.pop("criteria", [])
        program = Program.objects.create(**validated_data)
        self._save_nested(program, items_data, criteria_data)
        return program

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        criteria_data = validated_data.pop("criteria", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        self._save_nested(instance, items_data, criteria_data)
        return instance
