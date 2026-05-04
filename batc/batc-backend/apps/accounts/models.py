from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    STAFF = "STAFF", "Staff"
    CLIENT = "CLIENT", "Client"


class User(AbstractUser):
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT, db_index=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    # ------------------------------------------------------------------
    # Role helpers — always check .role directly; never rely on Django's
    # .is_staff field for BATC permission logic (use these properties or
    # the IsAdmin / IsStaffOrAdmin permission classes instead).
    # ------------------------------------------------------------------

    @property
    def is_admin(self):
        """True only for the ADMIN role."""
        return self.role == Role.ADMIN

    @property
    def is_staff_role(self):
        """True for the STAFF role (field-ops / encoders)."""
        return self.role == Role.STAFF

    @property
    def is_client(self):
        """True for CLIENT (farmer-facing) accounts."""
        return self.role == Role.CLIENT

    # ------------------------------------------------------------------
    # Keep Django's built-in is_staff in sync with role so the Django
    # admin console is only accessible to ADMIN role users (Finding #21).
    # ------------------------------------------------------------------

    def save(self, *args, **kwargs):
        # Sync Django's is_staff flag: only ADMIN role gets admin-site access.
        # Always recompute is_staff from role so the two fields never diverge,
        # and always append "is_staff" to update_fields (if provided) so the
        # sync is persisted even on partial saves (e.g. reset_password only
        # passes update_fields=["password"], which previously left is_staff
        # stale in the DB for any role-change edge cases).
        self.is_staff = self.role == Role.ADMIN
        update_fields = kwargs.get("update_fields")
        if update_fields is not None and "is_staff" not in update_fields:
            kwargs["update_fields"] = list(update_fields) + ["is_staff"]
        super().save(*args, **kwargs)

    def archive(self):
        from django.utils import timezone
        self.is_archived = True
        self.archived_at = timezone.now()
        self.is_active = False
        self.is_staff = False   # C-1: revoke admin-site access on archive
        self.save(update_fields=["is_archived", "archived_at", "is_active", "is_staff"])

    def unarchive(self):
        self.is_archived = False
        self.archived_at = None
        self.is_active = True
        self.is_staff = self.role == Role.ADMIN  # C-1: restore is_staff based on role
        self.save(update_fields=["is_archived", "archived_at", "is_active", "is_staff"])
