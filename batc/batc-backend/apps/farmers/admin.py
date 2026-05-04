from django.contrib import admin
from apps.farmers.models import Farmer, FarmParcel


class FarmParcelInline(admin.TabularInline):
    model = FarmParcel
    extra = 0


@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ["full_name", "barangay", "mobile_number", "livelihood_type", "consent_dpa", "is_archived"]
    list_filter = ["barangay", "livelihood_type", "is_archived"]
    search_fields = ["first_name", "last_name", "mobile_number", "rsbsa_reference"]
    inlines = [FarmParcelInline]
