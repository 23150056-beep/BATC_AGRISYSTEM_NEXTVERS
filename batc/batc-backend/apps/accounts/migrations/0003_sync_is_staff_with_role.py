"""
Finding #21 — is_staff / role naming confusion.

Sync Django's built-in `is_staff` flag with BATC's `role` field for all
existing users so that:
  - ADMIN role → is_staff = True  (gets Django admin access)
  - STAFF / CLIENT → is_staff = False (no Django admin access)

Going forward the User.save() override keeps these in sync automatically.
"""
from django.db import migrations


def sync_is_staff(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    # Grant admin-site access only to ADMIN role
    User.objects.filter(role="ADMIN").update(is_staff=True)
    # Revoke from everyone else (safe default)
    User.objects.exclude(role="ADMIN").update(is_staff=False)


def reverse_sync(apps, schema_editor):
    # Non-destructive reverse: reset everyone to False.
    # Callers can re-run makemigrations / re-apply to restore.
    User = apps.get_model("accounts", "User")
    User.objects.all().update(is_staff=False)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_newest_first_ordering"),
    ]

    operations = [
        migrations.RunPython(sync_is_staff, reverse_sync),
    ]
