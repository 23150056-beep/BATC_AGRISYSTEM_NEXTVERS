"""
Management command: python manage.py fix_locked_accounts

Finds user accounts where is_active=False (archived or otherwise locked out)
and optionally restores them so they can log in again.

Usage:
    python manage.py fix_locked_accounts                       # dry-run, show affected accounts
    python manage.py fix_locked_accounts --execute             # restore ALL locked accounts
    python manage.py fix_locked_accounts --role CLIENT         # dry-run, only farmer accounts
    python manage.py fix_locked_accounts --role CLIENT --execute  # restore locked farmers only
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Find and optionally restore locked (is_active=False) user accounts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Actually restore the locked accounts (default is dry-run, safe to run first).",
        )
        parser.add_argument(
            "--role",
            default="",
            metavar="ROLE",
            help="Restrict to a specific role: ADMIN, STAFF, or CLIENT. Omit to check all roles.",
        )

    def handle(self, *args, **opts):
        from apps.accounts.models import User

        execute = opts["execute"]
        role_filter = (opts["role"] or "").strip().upper()

        qs = User.objects.filter(is_active=False).order_by("role", "username")
        if role_filter:
            qs = qs.filter(role=role_filter)

        if not qs.exists():
            self.stdout.write(self.style.SUCCESS("No locked accounts found - all clear!"))
            return

        self.stdout.write(f"\nLocked accounts ({qs.count()}):\n")
        self.stdout.write(f"  {'Username':<22} {'Role':<8} {'is_archived':<13} {'archived_at'}")
        self.stdout.write("  " + "-" * 65)
        for u in qs:
            self.stdout.write(
                f"  {u.username:<22} {u.role:<8} {str(u.is_archived):<13} {u.archived_at or '—'}"
            )

        if not execute:
            self.stdout.write(
                self.style.NOTICE(
                    f"\n[DRY-RUN] {qs.count()} account(s) would be restored. "
                    "Re-run with --execute to apply."
                )
            )
            return

        self.stdout.write("")
        restored = 0
        for u in qs:
            u.unarchive()
            self.stdout.write(self.style.SUCCESS(f"  Restored: {u.username} ({u.role})"))
            restored += 1

        self.stdout.write(
            self.style.SUCCESS(f"\nDone. {restored} account(s) restored and can now log in.")
        )
