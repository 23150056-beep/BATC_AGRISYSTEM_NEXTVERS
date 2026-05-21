"""Add subgroup targeting and pinning to announcements."""
from django.db import migrations, models
from apps.farmers.constants import BARANGAY_CHOICES


class Migration(migrations.Migration):

    dependencies = [
        ("announcements", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="announcement",
            name="target_barangay",
            field=models.CharField(
                blank=True, choices=BARANGAY_CHOICES, max_length=100,
                help_text="Restrict to farmers in this barangay. Blank = all barangays.",
            ),
        ),
        migrations.AddField(
            model_name="announcement",
            name="target_segments",
            field=models.JSONField(
                blank=True, default=list,
                help_text='Subset of farmer segments: "4PS", "PWD", "IP". Empty = no segment filter.',
            ),
        ),
        migrations.AddField(
            model_name="announcement",
            name="is_pinned",
            field=models.BooleanField(default=False, db_index=True),
        ),
        migrations.AlterModelOptions(
            name="announcement",
            options={"ordering": ["-is_pinned", "-published_at"]},
        ),
    ]
