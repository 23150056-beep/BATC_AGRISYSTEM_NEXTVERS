"""
One-shot data-repair management command for the Bautista farmer's missing
distribution. Idempotent — re-running is a no-op. Defaults to dry-run; pass
``--execute`` to actually mutate state.

Usage:
    python manage.py fix_bautista              # dry-run (safe)
    python manage.py fix_bautista --execute    # actually apply changes
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.farmers.models import Farmer
from apps.programs.models import Program
from apps.applications.models import InterventionApplication, ApplicationStatus
from apps.distribution.models import Distribution, DistributionStatus
from apps.distribution.services import create_distribution, update_status


class Command(BaseCommand):
    help = "Repair the Bautista farmer's CSA-2026-Q1 application/distribution."

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Actually apply the fix (default is dry-run).",
        )

    def handle(self, *args, **opts):
        execute = opts["execute"]
        prefix = "[DRY-RUN] " if not execute else ""

        try:
            staff01 = User.objects.get(username="staff01")
            farmer = Farmer.objects.get(last_name="Bautista")
            prog = Program.objects.get(code="CSA-2026-Q1")
        except (User.DoesNotExist, Farmer.DoesNotExist, Program.DoesNotExist) as e:
            raise CommandError(f"Required record missing: {e}")

        # Idempotency check — if a delivered distribution already exists for this
        # farmer/program, do nothing (re-running was the original footgun).
        existing_delivered = Distribution.objects.filter(
            farmer=farmer, program=prog, status=DistributionStatus.DELIVERED
        ).first()
        if existing_delivered:
            self.stdout.write(self.style.WARNING(
                f"Already delivered: distribution #{existing_delivered.pk} for "
                f"{farmer.full_name} / {prog.code}. Nothing to do."
            ))
            return

        # Inspect existing applications without mutating
        app_qs = InterventionApplication.objects.filter(farmer=farmer, program=prog)
        partials = []
        for app in app_qs:
            has_dist = Distribution.objects.filter(application=app).exists()
            self.stdout.write(f"  Found app #{app.pk} status={app.status} has_dist={has_dist}")
            if not has_dist:
                partials.append(app)

        if not execute:
            self.stdout.write(self.style.NOTICE(
                f"{prefix}Would delete {len(partials)} partial application(s) and "
                f"recreate one APPROVED app + delivered distribution."
            ))
            self.stdout.write(self.style.NOTICE("Re-run with --execute to apply."))
            return

        # Execute, atomically
        with transaction.atomic():
            for app in partials:
                self.stdout.write(f"  Deleting partial app #{app.pk}…")
                app.delete()

            app = InterventionApplication.objects.create(
                farmer=farmer,
                program=prog,
                status=ApplicationStatus.APPROVED,
                reviewed_by=staff01,
                reviewed_at=timezone.now(),
            )
            self.stdout.write(self.style.SUCCESS(f"  Created app #{app.pk}"))

            dist = create_distribution(app, by_user=staff01)
            dist.scheduled_date = date.today() - timedelta(days=5)
            dist.save(update_fields=["scheduled_date"])
            update_status(dist, "DELIVERED", "", staff01)

            self.stdout.write(self.style.SUCCESS(
                f"  Distribution #{dist.pk} marked DELIVERED. App status now: "
                f"{InterventionApplication.objects.get(pk=app.pk).status}"
            ))
