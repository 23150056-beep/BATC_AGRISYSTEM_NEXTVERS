from django.db import models


class ProgramStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    COMPLETED = "COMPLETED", "Completed"


class Program(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30, unique=True)
    source_agency = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=ProgramStatus.choices, default=ProgramStatus.DRAFT, db_index=True)
    start_date = models.DateField()
    end_date = models.DateField()
    # JSON list of barangay names; empty list = all barangays
    target_barangays = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        "accounts.User", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_programs"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} [{self.code}]"


class CriterionField(models.TextChoices):
    LIVELIHOOD_TYPE = "livelihood_type", "Livelihood Type"
    IS_4PS = "is_4ps", "4Ps Beneficiary"
    IS_PWD = "is_pwd", "PWD"
    IS_IP = "is_ip", "Indigenous People"
    FARM_AREA_HA = "farm_area_ha", "Farm Area (ha)"
    HOUSEHOLD_SIZE = "household_size", "Household Size"


class CriterionOperator(models.TextChoices):
    EQ = "eq", "equals"
    GTE = "gte", "greater than or equal"
    LTE = "lte", "less than or equal"
    IS_TRUE = "is_true", "is true"


class EligibilityCriterion(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="criteria")
    field = models.CharField(max_length=30, choices=CriterionField.choices)
    operator = models.CharField(max_length=10, choices=CriterionOperator.choices)
    value = models.CharField(max_length=100, blank=True)
    fail_message = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.field} {self.operator} {self.value}"


class ProgramItem(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="items")
    inventory_item = models.ForeignKey(
        "inventory.InventoryItem", on_delete=models.PROTECT, related_name="program_items"
    )
    qty_per_beneficiary = models.DecimalField(max_digits=10, decimal_places=2)
    max_per_farmer = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = [("program", "inventory_item")]

    def __str__(self):
        return f"{self.program.code} — {self.inventory_item.name}"
