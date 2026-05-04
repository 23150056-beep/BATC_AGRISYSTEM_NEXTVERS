"""
Management command: python manage.py seed_demo

Populates the database with a realistic demo dataset for the BATC prototype.
Safe to run multiple times — skips objects that already exist by natural key.
"""
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed demo data for the BATC prototype."

    def handle(self, *args, **options):
        self._users()
        self._farmers()
        item, batches = self._inventory()
        program = self._program(item)
        self._applications_and_distributions(program, batches)
        self._announcements()
        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

    # ------------------------------------------------------------------ users
    def _users(self):
        from apps.accounts.models import User, Role

        users = [
            {"username": "admin",    "password": "admin1234",   "role": Role.ADMIN,  "first_name": "Ana",    "last_name": "Reyes"},
            {"username": "staff01",  "password": "staff1234",   "role": Role.STAFF,  "first_name": "Ben",    "last_name": "Santos"},
            {"username": "staff02",  "password": "staff1234",   "role": Role.STAFF,  "first_name": "Carla",  "last_name": "Dela Cruz"},
            {"username": "staff03",  "password": "staff1234",   "role": Role.STAFF,  "first_name": "Diego",  "last_name": "Lim"},
            {"username": "farmer01", "password": "farmer1234",  "role": Role.CLIENT, "first_name": "Eduardo","last_name": "Aguilar"},
            {"username": "farmer02", "password": "farmer1234",  "role": Role.CLIENT, "first_name": "Fiona",  "last_name": "Bautista"},
            {"username": "farmer03", "password": "farmer1234",  "role": Role.CLIENT, "first_name": "George", "last_name": "Castillo"},
        ]
        for u in users:
            obj, created = User.objects.get_or_create(username=u["username"], defaults={
                "role": u["role"], "first_name": u["first_name"], "last_name": u["last_name"],
            })
            if created:
                obj.set_password(u["password"])
                obj.save()
                self.stdout.write(f"  Created user: {obj.username}")

    # ---------------------------------------------------------------- farmers
    def _farmers(self):
        from apps.accounts.models import User
        from apps.farmers.models import Farmer, FarmParcel

        admin = User.objects.get(username="admin")
        staff01 = User.objects.get(username="staff01")

        farmer_data = [
            {
                "user": "farmer01", "first_name": "Eduardo", "last_name": "Aguilar",
                "barangay": "San Juan", "livelihood_type": "RICE",
                "farm_area_ha": "1.5", "household_size": 4, "is_4ps": True,
            },
            {
                "user": "farmer02", "first_name": "Fiona", "last_name": "Bautista",
                "barangay": "Lingsat", "livelihood_type": "CORN",
                "farm_area_ha": "0.8", "household_size": 3, "is_4ps": False,
            },
            {
                "user": "farmer03", "first_name": "George", "last_name": "Castillo",
                "barangay": "San Felipe", "livelihood_type": "RICE",
                "farm_area_ha": "2.0", "household_size": 5, "is_4ps": True,
            },
            {
                "user": None, "first_name": "Helen", "last_name": "Domingo",
                "barangay": "San Juan", "livelihood_type": "RICE",
                "farm_area_ha": "1.2", "household_size": 2, "is_4ps": True,
            },
            {
                "user": None, "first_name": "Ivan", "last_name": "Espiritu",
                "barangay": "Pagdalagan Norte", "livelihood_type": "VEGETABLE",
                "farm_area_ha": "0.5", "household_size": 6, "is_4ps": False,
            },
            {
                "user": None, "first_name": "Julia", "last_name": "Flores",
                "barangay": "Pagdalagan Sur", "livelihood_type": "RICE",
                "farm_area_ha": "1.0", "household_size": 4, "is_4ps": True,
            },
            {
                "user": None, "first_name": "Karl", "last_name": "Garcia",
                "barangay": "Lingsat", "livelihood_type": "RICE",
                "farm_area_ha": "1.8", "household_size": 3, "is_4ps": False,
            },
            {
                "user": None, "first_name": "Luz", "last_name": "Hernandez",
                "barangay": "San Felipe", "livelihood_type": "CORN",
                "farm_area_ha": "0.7", "household_size": 5, "is_4ps": True,
            },
            {
                "user": None, "first_name": "Marco", "last_name": "Ilagan",
                "barangay": "San Juan", "livelihood_type": "RICE",
                "farm_area_ha": "1.3", "household_size": 4, "is_4ps": True,
            },
            {
                "user": None, "first_name": "Nora", "last_name": "Jacinto",
                "barangay": "Pagdalagan Norte", "livelihood_type": "RICE",
                "farm_area_ha": "0.9", "household_size": 2, "is_4ps": False,
            },
            {
                "user": None, "first_name": "Oscar", "last_name": "Kinilayan",
                "barangay": "Pagdalagan Sur", "livelihood_type": "RICE",
                "farm_area_ha": "1.1", "household_size": 7, "is_4ps": True,
            },
            {
                "user": None, "first_name": "Paula", "last_name": "Lopez",
                "barangay": "Lingsat", "livelihood_type": "RICE",
                "farm_area_ha": "2.5", "household_size": 6, "is_4ps": True,
            },
            {
                "user": None, "first_name": "Quinn", "last_name": "Mariano",
                "barangay": "San Felipe", "livelihood_type": "VEGETABLE",
                "farm_area_ha": "0.3", "household_size": 3, "is_4ps": False,
            },
        ]

        for idx, fd in enumerate(farmer_data):
            mobile = f"+639{str(900000000 + idx).zfill(9)}"  # canonical E.164 form
            # encoded_by is always the actual encoder (audit trail).
            # linked_user is only set when fd["user"] points to a CLIENT account.
            encoder = staff01 if idx % 2 == 0 else admin
            linked_client = None
            if fd["user"]:
                try:
                    candidate = User.objects.get(username=fd["user"])
                    if candidate.role == "CLIENT":
                        linked_client = candidate
                except User.DoesNotExist:
                    pass

            farmer, created = Farmer.objects.get_or_create(
                first_name=fd["first_name"], last_name=fd["last_name"],
                defaults={
                    "sex": "M" if idx % 2 == 0 else "F",
                    "dob": date(1980 + idx, 1, 15),
                    "civil_status": "MARRIED",
                    "mobile_number": mobile,
                    "barangay": fd["barangay"],
                    "sitio": "",
                    "livelihood_type": fd["livelihood_type"],
                    "farm_area_ha": fd["farm_area_ha"],
                    "household_size": fd["household_size"],
                    "is_4ps": fd["is_4ps"],
                    "consent_dpa": True,
                    "encoded_by": encoder,
                    "linked_user": linked_client,
                }
            )
            if created:
                # Add one parcel
                FarmParcel.objects.create(
                    farmer=farmer,
                    area_ha=Decimal(fd["farm_area_ha"]),
                    commodity=fd["livelihood_type"],
                    land_type="LOWLAND",
                    ownership_type="OWNER",
                )
                self.stdout.write(f"  Created farmer: {farmer.full_name}")

    # --------------------------------------------------------------- inventory
    def _inventory(self):
        from apps.accounts.models import User
        from apps.inventory.models import InventoryItem
        from apps.inventory.services import receive_stock

        admin = User.objects.get(username="admin")
        today = date.today()

        item, _ = InventoryItem.objects.get_or_create(
            name="Certified Rice Seeds",
            defaults={"category": "SEEDS", "unit": "kg", "low_stock_threshold": "50"},
        )

        batches = list(item.batches.all())
        if len(batches) < 2:
            b1 = receive_stock(
                item_id=item.pk,
                lot_number="LOT-2026-A",
                received_date=today - timedelta(days=30),
                expiry_date=today + timedelta(days=180),
                quantity=Decimal("500"),
                created_by=admin,
                reference_note="Initial stock — DA Region I",
            )
            b2 = receive_stock(
                item_id=item.pk,
                lot_number="LOT-2026-B",
                received_date=today - timedelta(days=10),
                expiry_date=today + timedelta(days=365),
                quantity=Decimal("300"),
                created_by=admin,
                reference_note="Supplemental stock",
            )
            batches = [b1, b2]
            self.stdout.write("  Created inventory batches for Certified Rice Seeds")

        return item, batches

    # ---------------------------------------------------------------- program
    def _program(self, item):
        from apps.programs.models import Program, ProgramStatus, ProgramItem, EligibilityCriterion

        program, created = Program.objects.get_or_create(
            code="RSA-2026-Q1",
            defaults={
                "name": "Rice Seed Assistance 2026 — Q1",
                "source_agency": "DA Region I",
                "status": ProgramStatus.ACTIVE,
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 6, 30),
                "target_barangays": ["San Juan", "Lingsat", "San Felipe", "Pagdalagan Norte", "Pagdalagan Sur"],
            }
        )

        if created:
            ProgramItem.objects.create(
                program=program,
                inventory_item=item,
                qty_per_beneficiary="25",
            )
            EligibilityCriterion.objects.create(
                program=program,
                field="livelihood_type",
                operator="eq",
                value="RICE",
                fail_message="Only rice farmers are eligible for this program.",
            )
            EligibilityCriterion.objects.create(
                program=program,
                field="is_4ps",
                operator="is_true",
                value="",
                fail_message="Priority is given to 4Ps beneficiaries.",
            )
            self.stdout.write(f"  Created program: {program.name}")

        return program

    # ---------------------------------------- applications & distributions
    def _applications_and_distributions(self, program, batches):
        from apps.accounts.models import User
        from apps.farmers.models import Farmer
        from apps.programs.services import get_eligible_farmers
        from apps.applications.models import InterventionApplication, ApplicationStatus
        from apps.distribution.models import Distribution, DistributionStatus
        from apps.distribution.services import create_distribution, update_status

        staff01 = User.objects.get(username="staff01")
        eligible = list(get_eligible_farmers(program))

        if not eligible:
            self.stdout.write(self.style.WARNING("  No eligible farmers found — skipping applications."))
            return

        statuses_to_create = [
            ApplicationStatus.FULFILLED,
            ApplicationStatus.APPROVED,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.FULFILLED,
        ]

        for idx, farmer in enumerate(eligible[:5]):
            app_status = statuses_to_create[idx] if idx < len(statuses_to_create) else ApplicationStatus.SUBMITTED

            app, created = InterventionApplication.objects.get_or_create(
                farmer=farmer, program=program,
                defaults={"status": app_status},
            )
            if not created:
                continue

            if app_status == ApplicationStatus.APPROVED:
                app.reviewed_by = staff01
                app.reviewed_at = timezone.now()
                app.save()
                try:
                    dist = create_distribution(app, by_user=staff01)
                    self.stdout.write(f"  Distribution created for {farmer.full_name}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped distribution for {farmer.full_name}: {e}"))

            elif app_status == ApplicationStatus.FULFILLED:
                app.reviewed_by = staff01
                app.reviewed_at = timezone.now()
                app.save()
                try:
                    dist = create_distribution(app, by_user=staff01)
                    dist.scheduled_date = date.today() - timedelta(days=3)
                    dist.save(update_fields=["scheduled_date"])
                    update_status(dist, "DELIVERED", "Delivered successfully.", staff01)
                    self.stdout.write(f"  Fulfilled distribution for {farmer.full_name}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Skipped fulfilled dist for {farmer.full_name}: {e}"))

            elif app_status == ApplicationStatus.REJECTED:
                app.reviewed_by = staff01
                app.reviewed_at = timezone.now()
                app.rejection_reason = "Livelihood type does not match program criteria upon review."
                app.save()

            self.stdout.write(f"  Application ({app_status}) for {farmer.full_name}")

    # --------------------------------------------------------- announcements
    def _announcements(self):
        from apps.accounts.models import User
        from apps.announcements.models import Announcement

        admin = User.objects.get(username="admin")

        announcements = [
            {
                "title": "Welcome to BATC Farmer Portal",
                "body": "The Bauang Agricultural Trade Center online portal is now available. "
                        "Farmers can now apply for assistance programs, track their distribution status, "
                        "and submit feedback directly through this system.",
                "target_roles": ["ADMIN", "STAFF", "CLIENT"],
            },
            {
                "title": "Rice Seed Assistance 2026 — Q1 Now Open",
                "body": "Applications for the Rice Seed Assistance Program 2026 Q1 are now being accepted. "
                        "Eligible rice farmers in target barangays may apply through the Programs tab. "
                        "Distribution is scheduled for February–March 2026.",
                "target_roles": ["CLIENT"],
            },
            {
                "title": "Staff: New Application Review Process",
                "body": "All submitted applications must be reviewed within 5 working days. "
                        "Please use the Applications queue to approve or reject pending submissions. "
                        "Contact the admin for questions.",
                "target_roles": ["STAFF", "ADMIN"],
            },
        ]

        for ann in announcements:
            exists = Announcement.objects.filter(title=ann["title"]).exists()
            if not exists:
                Announcement.objects.create(
                    title=ann["title"],
                    body=ann["body"],
                    target_roles=ann["target_roles"],
                    created_by=admin,
                )
                self.stdout.write(f"  Created announcement: {ann['title']}")
