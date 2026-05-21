from django.db import models
from django.conf import settings
from apps.farmers.constants import BARANGAY_CHOICES


# Farmer-segment flags. Stored as strings in Announcement.target_segments so we
# don't have to keep this list in sync with column names elsewhere.
SEGMENT_4PS = "4PS"
SEGMENT_PWD = "PWD"
SEGMENT_IP = "IP"
VALID_SEGMENTS = {SEGMENT_4PS, SEGMENT_PWD, SEGMENT_IP}

# Friendly labels used by serializers / UI.
SEGMENT_LABELS = {
    SEGMENT_4PS: "4Ps beneficiaries",
    SEGMENT_PWD: "PWD",
    SEGMENT_IP:  "Indigenous People",
}


class Announcement(models.Model):
    title        = models.CharField(max_length=200)
    body         = models.TextField()
    target_roles = models.JSONField(default=list)  # e.g. ["ADMIN","STAFF","CLIENT"]

    # Optional farmer-subgroup targeting. Both fields only apply when
    # target_roles includes "CLIENT" — they are ignored for STAFF/ADMIN-only
    # announcements (which always reach everyone in the role).
    target_barangay = models.CharField(
        max_length=100, blank=True, choices=BARANGAY_CHOICES,
        help_text="Restrict to farmers in this barangay. Blank = all barangays.",
    )
    target_segments = models.JSONField(
        default=list, blank=True,
        help_text='Subset of farmer segments: "4PS", "PWD", "IP". Empty = no segment filter.',
    )

    is_pinned    = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(auto_now_add=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="announcements"
    )

    class Meta:
        # Pinned posts first, then newest. The composite ordering is also
        # respected by DRF's default pagination so admins always see pins on
        # page 1.
        ordering = ["-is_pinned", "-published_at"]

    def __str__(self):
        return self.title

    def visible_to_farmer(self, farmer) -> bool:
        """
        Return True if this announcement should reach `farmer` based on its
        barangay/segment filters. STAFF/ADMIN-only announcements should be
        excluded earlier by the role check; this only handles the CLIENT
        subgroup filters.
        """
        if self.target_barangay and self.target_barangay != farmer.barangay:
            return False
        if self.target_segments:
            farmer_segs = set()
            if farmer.is_4ps: farmer_segs.add(SEGMENT_4PS)
            if farmer.is_pwd: farmer_segs.add(SEGMENT_PWD)
            if farmer.is_ip:  farmer_segs.add(SEGMENT_IP)
            if not (set(self.target_segments) & farmer_segs):
                return False
        return True
