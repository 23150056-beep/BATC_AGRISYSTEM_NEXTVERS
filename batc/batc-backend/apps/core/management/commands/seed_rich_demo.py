"""
python manage.py seed_rich_demo

Adds rich demo data on top of seed_demo:
  - 1 more inventory item (Ammonium Sulfate Fertilizer)
  - 2 more programs (Corn Seed Assistance, Fertilizer Subsidy)
  - Applications covering every status across all programs
  - Distributions in every status (SCHEDULED, DELIVERED, DELAYED, RESCHEDULED)
  - Feedback from farmers who received deliveries

Safe to re-run — skips anything already created.
"""
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed rich demo data for BATC prototype walkthrough."

    def handle(self, *args, **options):
        staff01 = self._get_user("staff01")
        admin   = self._get_user("admin")

        # --- Inventory ---
        rice_item  = self._get_item("Certified Rice Seeds")
        fert_item  = self._ensure_fertilizer(admin)

        # --- Programs ---
        corn_prog = self._ensure_corn_program(rice_item)       # uses rice seeds too
        fert_prog = self._ensure_fertilizer_program(fert_item)

        # --- Applications + Distributions ---
        self._seed_corn_program(corn_prog, staff01)
        self._seed_fertilizer_program(fert_prog, staff01, admin)

        # --- Feedback ---
        self._seed_feedback()

        self.stdout.write(self.style.SUCCESS("Rich demo data seeded successfully."))

    # ---------------------------------------------------------------- helpers
    def _get_user(self, username):
        from apps.accounts.models import User
        return User.objects.get(username=username)

    def _get_item(self, name):
        from apps.inventory.models import InventoryItem
        return InventoryItem.objects.get(name=name)

    def _get_farmer(self, last_name):
        from apps.farmers.models import Farmer
        return Farmer.objects.filter(last_name=last_name).first()

    # ----------------------------------------------------------- fertilizer
    def _ensure_fertilizer(self, admin):
        from apps.inventory.models import InventoryItem
        from apps.inventory.services import receive_stock

        item, created = InventoryItem.objects.get_or_create(
            name="Ammonium Sulfate Fertilizer",
            defaults={"category": "FERTILIZER", "unit": "bag", "low_stock_threshold": "20"},
        )
        if created:
            today = date.today()
            receive_stock(
                item_id=item.pk,
                lot_number="FERT-2026-A",
                received_date=today - timedelta(days=20),
                expiry_date=today + timedelta(days=540),
                quantity=Decimal("150"),
                created_by=admin,
                reference_note="DA Region I — Fertilizer allocation",
            )
            receive_stock(
                item_id=item.pk,
                lot_number="FERT-2026-B",
                received_date=today - timedelta(days=5),
                expiry_date=today + timedelta(days=720),
                quantity=Decimal("80"),
                created_by=admin,
                reference_note="Supplemental batch",
            )
            self.stdout.write("  Created: Ammonium Sulfate Fertilizer (2 batches)")
        return item

    # --------------------------------------------------- corn seed program
    def _ensure_corn_program(self, rice_item):
        from apps.programs.models import Program, ProgramStatus, ProgramItem, EligibilityCriterion

        prog, created = Program.objects.get_or_create(
            code="CSA-2026-Q1",
            defaults={
                "name": "Corn Seed Assistance 2026",
                "source_agency": "DA Region I",
                "status": ProgramStatus.ACTIVE,
                "start_date": date(2026, 2, 1),
                "end_date": date(2026, 7, 31),
                "target_barangays": ["Lingsat", "San Felipe", "Pagdalagan Norte", "Pagdalagan Sur", "San Juan"],
            }
        )
        if created:
            ProgramItem.objects.create(
                program=prog,
                inventory_item=rice_item,
                qty_per_beneficiary="15",
            )
            EligibilityCriterion.objects.create(
                program=prog,
                field="livelihood_type",
                operator="eq",
                value="CORN",
                fail_message="This program is for corn farmers only.",
            )
            self.stdout.write("  Created program: Corn Seed Assistance 2026")
        return prog

    # --------------------------------------------- fertilizer subsidy program
    def _ensure_fertilizer_program(self, fert_item):
        from apps.programs.models import Program, ProgramStatus, ProgramItem, EligibilityCriterion

        prog, created = Program.objects.get_or_create(
            code="FS-2026-Q1",
            defaults={
                "name": "Fertilizer Subsidy Program 2026",
                "source_agency": "LGU Bauang",
                "status": ProgramStatus.ACTIVE,
                "start_date": date(2026, 1, 15),
                "end_date": date(2026, 8, 31),
                "target_barangays": [
                    "San Juan", "Lingsat", "San Felipe",
                    "Pagdalagan Norte", "Pagdalagan Sur",
                    "Casilagan", "Bella Union",
                ],
            }
        )
        if created:
            ProgramItem.objects.create(
                program=prog,
                inventory_item=fert_item,
                qty_per_beneficiary="3",
            )
            EligibilityCriterion.objects.create(
                program=prog,
                field="is_4ps",
                operator="is_true",
                value="",
                fail_message="This subsidy is reserved for 4Ps beneficiaries.",
            )
            EligibilityCriterion.objects.create(
                program=prog,
                field="farm_area_ha",
                operator="gte",
                value="0.5",
                fail_message="Farm area must be at least 0.5 hectares.",
            )
            self.stdout.write("  Created program: Fertilizer Subsidy Program 2026")
        return prog

    # ----------------------------------------- corn program applications
    def _seed_corn_program(self, prog, staff01):
        from apps.applications.models import InterventionApplication, ApplicationStatus
        from apps.distribution.models import Distribution, DistributionStatus
        from apps.distribution.services import create_distribution, update_status

        # Corn-eligible farmers: Fiona Bautista (CORN), Luz Hernandez (CORN)
        scenarios = [
            # (farmer_last_name, app_status, dist_status, dist_remarks, days_offset)
            ("Bautista", ApplicationStatus.FULFILLED,    "DELIVERED",   "",                          -5),
            ("Hernandez", ApplicationStatus.SUBMITTED,   None,          "",                           0),
        ]

        today = date.today()
        for last_name, app_status, dist_status, remarks, day_offset in scenarios:
            farmer = self._get_farmer(last_name)
            if not farmer:
                continue

            app, created = InterventionApplication.objects.get_or_create(
                farmer=farmer, program=prog,
                defaults={"status": app_status, "reviewed_by": staff01, "reviewed_at": timezone.now()},
            )
            if not created:
                continue

            self.stdout.write(f"  App [{app_status}]: {farmer.full_name} -> {prog.code}")

            if dist_status:
                try:
                    dist = create_distribution(app, by_user=staff01)
                    dist.scheduled_date = today + timedelta(days=day_offset)
                    dist.save(update_fields=["scheduled_date"])
                    if dist_status != "SCHEDULED":
                        update_status(dist, dist_status, remarks, staff01)
                    self.stdout.write(f"    Distribution [{dist_status}]")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"    Skipped dist: {e}"))

    # -------------------------------------- fertilizer program applications
    def _seed_fertilizer_program(self, prog, staff01, admin):
        from apps.applications.models import InterventionApplication, ApplicationStatus
        from apps.distribution.services import create_distribution, update_status

        today = date.today()

        # 4Ps farmers with >= 0.5 ha:
        # Eduardo Aguilar (1.5ha, 4Ps), George Castillo (2.0ha, 4Ps),
        # Helen Domingo (1.2ha, 4Ps), Luz Hernandez (0.7ha, 4Ps, CORN),
        # Marco Ilagan (1.3ha, 4Ps), Oscar Kinilayan (1.1ha, 4Ps),
        # Paula Lopez (2.5ha, 4Ps)

        scenarios = [
            # (last_name, app_status, dist_status, dist_sched_offset, remarks)
            ("Aguilar",    ApplicationStatus.FULFILLED,    "DELIVERED",    -7,  ""),
            ("Castillo",   ApplicationStatus.APPROVED,     "SCHEDULED",    +3,  ""),
            ("Domingo",    ApplicationStatus.APPROVED,     "DELAYED",      -1,  "Farmer unavailable on scheduled date. Will reschedule."),
            ("Hernandez",  ApplicationStatus.SUBMITTED,    None,           0,   ""),
            ("Ilagan",     ApplicationStatus.APPROVED,     "RESCHEDULED",  +5,  "Rescheduled due to barangay fiesta."),
            ("Kinilayan",  ApplicationStatus.REJECTED,     None,           0,   ""),
            ("Lopez",      ApplicationStatus.CANCELLED,    None,           0,   ""),
        ]

        for last_name, app_status, dist_status, day_offset, remarks in scenarios:
            farmer = self._get_farmer(last_name)
            if not farmer:
                continue

            # Set reviewed fields for non-submitted statuses
            defaults = {"status": app_status}
            if app_status not in (ApplicationStatus.SUBMITTED, ApplicationStatus.CANCELLED):
                defaults["reviewed_by"]  = staff01
                defaults["reviewed_at"]  = timezone.now()
            if app_status == ApplicationStatus.REJECTED:
                defaults["rejection_reason"] = "Farm area does not meet minimum requirement upon field verification."

            app, created = InterventionApplication.objects.get_or_create(
                farmer=farmer, program=prog, defaults=defaults,
            )
            if not created:
                continue

            self.stdout.write(f"  App [{app_status}]: {farmer.full_name} -> {prog.code}")

            if dist_status:
                try:
                    dist = create_distribution(app, by_user=staff01)
                    dist.scheduled_date = today + timedelta(days=day_offset)
                    dist.save(update_fields=["scheduled_date"])
                    if dist_status not in ("SCHEDULED",):
                        update_status(dist, dist_status, remarks, staff01)
                    self.stdout.write(f"    Distribution [{dist_status}] on {dist.scheduled_date}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"    Skipped dist: {e}"))

    # ------------------------------------------------------------- feedback
    def _seed_feedback(self):
        from apps.distribution.models import Distribution, DistributionStatus
        from apps.feedback.models import Feedback

        delivered = Distribution.objects.filter(status=DistributionStatus.DELIVERED).select_related("farmer")

        feedback_data = [
            (1, 5, "Salamat! Nakatanggap na kami ng binhi. Malaking tulong ito sa aming pamilya."),
            (2, 4, "Good service. The seeds were of good quality. Hope to receive more next time."),
            (3, 5, "Very thankful for this program. The staff were very accommodating and organized."),
            (4, 4, "Smooth process. The distribution was fast and organized."),
        ]

        added = 0
        for dist in delivered:
            if added >= len(feedback_data):
                break
            exists = Feedback.objects.filter(farmer=dist.farmer, distribution=dist).exists()
            if exists:
                continue
            rating, comment = feedback_data[added][1], feedback_data[added][2]
            status = "RESOLVED" if added == 0 else ("ACKNOWLEDGED" if added == 1 else "NEW")
            Feedback.objects.create(
                farmer=dist.farmer,
                distribution=dist,
                rating=rating,
                comment=comment,
                status=status,
            )
            self.stdout.write(f"  Feedback [{status}] ({rating}*): {dist.farmer.full_name}")
            added += 1
