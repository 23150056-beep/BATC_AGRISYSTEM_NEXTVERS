"""
Health audit for client accounts and the application/distribution graph.

Run periodically (or before a release) to surface the same class of bugs that
affected max01 — every CLIENT account that can sign in but can't actually use
the app. Also catches data inconsistencies between applications, distributions
and stock that would silently corrupt downstream views.

Usage:
    python manage.py audit_clients              # human-readable report
    python manage.py audit_clients --strict     # non-zero exit on findings
"""
from django.core.management.base import BaseCommand
from django.db.models import F, Count


class Command(BaseCommand):
    help = "Audit client accounts and workflow consistency."

    def add_arguments(self, parser):
        parser.add_argument(
            "--strict", action="store_true",
            help="Exit with status code 1 if any problems are found (CI-friendly).",
        )

    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.farmers.models import Farmer
        from apps.applications.models import InterventionApplication
        from apps.distribution.models import Distribution, DistributionItem
        from apps.inventory.models import StockBatch

        problems: list[tuple[str, str]] = []

        def warn(label, msg):
            problems.append((label, msg))
            self.stdout.write(self.style.WARNING(f"  ⚠ [{label}] {msg}"))

        def ok(msg):
            self.stdout.write(self.style.SUCCESS(f"  ✓ {msg}"))

        # ---------------------------------------------- structural ---------
        self.stdout.write(self.style.MIGRATE_HEADING("Structural integrity"))
        clients = User.objects.filter(role="CLIENT", is_archived=False)

        # Orphaned CLIENT users (role=CLIENT, no active farmer)
        orphan_count = 0
        for u in clients:
            if not Farmer.objects.filter(linked_user=u, is_archived=False).exists():
                warn("ORPHAN-CLIENT",
                     f"user '{u.username}' has CLIENT role but no active farmer profile linked")
                orphan_count += 1
        if not orphan_count:
            ok(f"All {clients.count()} CLIENT users have an active farmer profile linked")

        # CLIENT linked to archived farmer
        broken = 0
        for u in clients:
            if Farmer.objects.filter(linked_user=u, is_archived=True).exists():
                warn("CLIENT-ARCHIVED-FARMER",
                     f"user '{u.username}' linked to archived farmer")
                broken += 1
        if not broken:
            ok("No active CLIENT users linked to archived farmers")

        # Active farmer linked to archived user
        farmers = Farmer.objects.filter(is_archived=False, linked_user__isnull=False)
        bad_link = 0
        for f in farmers:
            if f.linked_user.is_archived:
                warn("FARMER-ARCHIVED-USER",
                     f"farmer #{f.pk} ({f.full_name}) linked to archived user "
                     f"'{f.linked_user.username}'")
                bad_link += 1
        if not bad_link:
            ok("No active farmers linked to archived users")

        # Duplicate linked_user (one user → multiple farmer rows)
        dups = (
            Farmer.objects.filter(linked_user__isnull=False)
            .values("linked_user").annotate(c=Count("id")).filter(c__gt=1)
        )
        if dups.exists():
            for d in dups:
                warn("DUP-LINKED-USER",
                     f"linked_user {d['linked_user']} has {d['c']} farmer rows "
                     f"(should be exactly 1)")
        else:
            ok("No duplicate farmer profiles per user")

        # ---------------------------------------------- workflow -----------
        self.stdout.write(self.style.MIGRATE_HEADING("\nWorkflow consistency"))

        apps_no_dist = InterventionApplication.objects.filter(
            status="APPROVED", distribution__isnull=True,
        )
        if apps_no_dist.exists():
            for a in apps_no_dist:
                warn("APPROVED-NO-DIST",
                     f"app #{a.pk} APPROVED but has no distribution row "
                     f"(farmer={a.farmer.full_name}, program={a.program.name})")
        else:
            ok("All APPROVED applications have a distribution row")

        ful = InterventionApplication.objects.filter(
            status="FULFILLED",
        ).select_related("distribution")
        weird = [a for a in ful if a.distribution and a.distribution.status != "DELIVERED"]
        if weird:
            for a in weird:
                warn("FULFILLED-NOT-DELIVERED",
                     f"app #{a.pk} marked FULFILLED but distribution status is "
                     f"'{a.distribution.status}'")
        else:
            ok("All FULFILLED applications have a DELIVERED distribution")

        mismatched = Distribution.objects.exclude(
            farmer_id=F("application__farmer_id"),
        )
        if mismatched.exists():
            for d in mismatched:
                warn("DIST-FARMER-MISMATCH",
                     f"distribution #{d.pk} farmer={d.farmer_id} but "
                     f"application.farmer={d.application.farmer_id}")
        else:
            ok("Distribution.farmer matches application.farmer everywhere")

        overrun = DistributionItem.objects.filter(
            quantity_released__gt=F("quantity_planned"),
        )
        if overrun.exists():
            for di in overrun:
                warn("OVERRUN",
                     f"DistributionItem #{di.pk} released "
                     f"{di.quantity_released} > planned {di.quantity_planned}")
        else:
            ok("No DistributionItem releases exceed planned quantities")

        neg = StockBatch.objects.filter(current_qty__lt=0)
        if neg.exists():
            for b in neg:
                warn("NEG-STOCK",
                     f"batch #{b.pk} ({b.lot_number}) has negative current_qty "
                     f"= {b.current_qty}")
        else:
            ok("No batches have negative current_qty")

        # ---------------------------------------------- summary ------------
        self.stdout.write("")
        self.stdout.write("=" * 60)
        if problems:
            self.stdout.write(self.style.ERROR(
                f"AUDIT FAILED: {len(problems)} problem(s) found"
            ))
            for label, msg in problems:
                self.stdout.write(f"  [{label}] {msg}")
            if options["strict"]:
                raise SystemExit(1)
        else:
            self.stdout.write(self.style.SUCCESS("AUDIT PASSED: no problems found"))
