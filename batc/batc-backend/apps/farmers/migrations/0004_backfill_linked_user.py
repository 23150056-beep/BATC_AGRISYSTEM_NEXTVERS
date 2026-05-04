"""
Data migration: backfill the new ``linked_user`` FK from existing
``encoded_by`` rows where the encoder happens to be a CLIENT.

Historically ``encoded_by`` was overloaded — it stored the staff/admin who
created the row, *unless* the wizard's "link to login account" was used, in
which case it was overwritten with the CLIENT user. This caused every
"is this farmer's record mine?" query to silently miss seeded farmers.

This migration:
  * Sets linked_user = encoded_by where encoded_by.role == "CLIENT"
  * Does NOT clear encoded_by — it remains as audit trail (and still surfaces
    correctly in the "Encoded By" column once the serializer is updated).
"""
from django.db import migrations


def backfill(apps, schema_editor):
    Farmer = apps.get_model("farmers", "Farmer")
    User = apps.get_model("accounts", "User")

    qs = Farmer.objects.filter(encoded_by__role="CLIENT", linked_user__isnull=True)
    moved = 0
    for f in qs.iterator():
        # Re-resolve user via historical model to stay schema-safe
        u = User.objects.filter(pk=f.encoded_by_id).first()
        if u is not None:
            f.linked_user_id = u.pk
            f.save(update_fields=["linked_user"])
            moved += 1
    print(f"  backfilled linked_user on {moved} farmer rows")


def noop(apps, schema_editor):
    # Reverse — leave linked_user populated. encoded_by is still authoritative.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("farmers", "0003_add_linked_user"),
    ]

    operations = [
        migrations.RunPython(backfill, reverse_code=noop),
    ]
