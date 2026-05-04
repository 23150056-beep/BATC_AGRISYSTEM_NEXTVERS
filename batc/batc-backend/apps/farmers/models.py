from django.db import models
from django.utils import timezone
from apps.farmers.constants import BARANGAY_CHOICES


class Sex(models.TextChoices):
    MALE = "M", "Male"
    FEMALE = "F", "Female"


class CivilStatus(models.TextChoices):
    SINGLE = "SINGLE", "Single"
    MARRIED = "MARRIED", "Married"
    WIDOWED = "WIDOWED", "Widowed"
    SEPARATED = "SEPARATED", "Separated"
    COMMON_LAW = "COMMON_LAW", "Common-law"


class Education(models.TextChoices):
    NONE = "NONE", "No formal education"
    ELEMENTARY = "ELEMENTARY", "Elementary"
    HIGH_SCHOOL = "HIGH_SCHOOL", "High School"
    VOCATIONAL = "VOCATIONAL", "Vocational / Technical"
    COLLEGE = "COLLEGE", "College"
    POST_GRAD = "POST_GRAD", "Post-graduate"


class LivelihoodType(models.TextChoices):
    RICE = "RICE", "Rice Farming"
    CORN = "CORN", "Corn Farming"
    VEGETABLE = "VEGETABLE", "Vegetable Farming"
    FRUIT = "FRUIT", "Fruit Farming"
    LIVESTOCK = "LIVESTOCK", "Livestock"
    POULTRY = "POULTRY", "Poultry"
    FISHERY = "FISHERY", "Fishery"
    OTHER = "OTHER", "Other"


class Farmer(models.Model):
    # Name
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    suffix = models.CharField(max_length=10, blank=True)

    # Personal
    sex = models.CharField(max_length=1, choices=Sex.choices)
    dob = models.DateField(verbose_name="Date of birth")
    civil_status = models.CharField(max_length=20, choices=CivilStatus.choices)
    highest_education = models.CharField(max_length=20, choices=Education.choices, default=Education.ELEMENTARY)

    # Contact
    mobile_number = models.CharField(max_length=15, unique=True)

    # Special categories
    is_4ps = models.BooleanField(default=False, verbose_name="4Ps beneficiary")
    is_pwd = models.BooleanField(default=False, verbose_name="PWD")
    is_ip = models.BooleanField(default=False, verbose_name="Indigenous People")

    # RSBSA
    rsbsa_reference = models.CharField(max_length=50, unique=True, null=True, blank=True)

    # Address
    barangay = models.CharField(max_length=100, choices=BARANGAY_CHOICES, db_index=True)
    sitio = models.CharField(max_length=100, blank=True)

    # Livelihood & farm
    livelihood_type = models.CharField(max_length=20, choices=LivelihoodType.choices, default=LivelihoodType.RICE)
    farm_area_ha = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    household_size = models.PositiveSmallIntegerField(default=1)

    # DPA
    consent_dpa = models.BooleanField(default=False)
    consent_dpa_at = models.DateTimeField(null=True, blank=True)

    # Meta
    # encoded_by = the staff/admin who created the record (audit trail).
    # linked_user = the optional CLIENT account that owns/views this record (portal access).
    # These are intentionally distinct — historically they were collapsed into
    # encoded_by which produced confusing "is this mine?" semantics.
    encoded_by = models.ForeignKey(
        "accounts.User", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="encoded_farmers"
    )
    linked_user = models.OneToOneField(
        "accounts.User", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="farmer_profile",
        help_text="The CLIENT account that can log in and view this farmer's data.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Cache previous consent state for save() to detect False→True transitions
        self.__original_consent_dpa = self.consent_dpa

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.barangay})"

    @property
    def full_name(self):
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name[0] + ".")
        parts.append(self.last_name)
        if self.suffix:
            parts.append(self.suffix)
        return " ".join(parts)

    def save(self, *args, **kwargs):
        # Refresh consent_dpa_at on every False→True (or first True) transition.
        # Previously the timestamp froze on first consent and stayed stale across
        # toggles, which made DPA audits unreliable (Finding #24).
        if self.consent_dpa and (
            not self.consent_dpa_at or not self.__original_consent_dpa
        ):
            self.consent_dpa_at = timezone.now()
        super().save(*args, **kwargs)
        self.__original_consent_dpa = self.consent_dpa

    def archive(self):
        self.is_archived = True
        self.archived_at = timezone.now()
        self.save(update_fields=["is_archived", "archived_at"])

    def unarchive(self):
        self.is_archived = False
        self.archived_at = None
        self.save(update_fields=["is_archived", "archived_at"])


class LandType(models.TextChoices):
    IRRIGATED = "IRRIGATED", "Irrigated"
    RAINFED_UPLAND = "RAINFED_UPLAND", "Rainfed Upland"
    RAINFED_LOWLAND = "RAINFED_LOWLAND", "Rainfed Lowland"


class OwnershipType(models.TextChoices):
    OWNED = "OWNED", "Owned"
    TENANT = "TENANT", "Tenant"
    LESSEE = "LESSEE", "Lessee"
    CARETAKER = "CARETAKER", "Caretaker"


class FarmParcel(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="parcels")
    area_ha = models.DecimalField(max_digits=8, decimal_places=4)
    commodity = models.CharField(max_length=100)
    land_type = models.CharField(max_length=20, choices=LandType.choices)
    ownership_type = models.CharField(max_length=20, choices=OwnershipType.choices)

    class Meta:
        ordering = ["id"]
