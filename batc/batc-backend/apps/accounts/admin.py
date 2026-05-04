from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.accounts.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "first_name", "last_name", "role", "is_archived"]
    list_filter = ["role", "is_archived"]
    fieldsets = UserAdmin.fieldsets + (
        ("BATC", {"fields": ("role", "is_archived", "archived_at")}),
    )
