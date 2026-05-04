"""
Signals that turn domain events into Notification rows.

Each receiver is intentionally small and defensive — a missing related row
should never break the underlying save.

Key fixes applied:
  C-5: staff broadcasts use bulk_create instead of one INSERT per user.
  M-13: quality signal uses instance.farmer.full_name (not the non-existent
        instance.farmer_name attribute).
  m-15: status-change notifications only fire when status actually changed,
        guarded via update_fields inspection.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.applications.models import InterventionApplication, ApplicationStatus
from apps.distribution.models import Distribution, DistributionStatus
from apps.feedback.models import Feedback
from apps.notifications.models import Notification, NotificationType


def _farmer_recipient(farmer):
    """Return the CLIENT user that owns the farmer profile, if any."""
    if farmer and getattr(farmer, "linked_user_id", None):
        return farmer.linked_user
    return None


def _staff_recipients():
    """Return all active STAFF + ADMIN users for broadcast notifications."""
    from apps.accounts.models import User
    return list(User.objects.filter(role__in=["STAFF", "ADMIN"], is_archived=False))


def _bulk_notify_staff(type_, title, body, link):
    """Create one Notification per active staff/admin in a single INSERT (C-5)."""
    recipients = _staff_recipients()
    if not recipients:
        return
    Notification.objects.bulk_create([
        Notification(
            recipient=user,
            type=type_,
            title=title,
            body=body,
            link=link,
        )
        for user in recipients
    ])


def _status_changed(instance, update_fields):
    """
    Return True when the 'status' field was genuinely updated.

    Django passes update_fields=None when save() is called without specifying
    fields (full save) — treat that as "possibly changed".
    When update_fields is specified, only fire if 'status' is in the list (m-15).
    """
    if update_fields is None:
        return True
    return "status" in update_fields


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

@receiver(post_save, sender=InterventionApplication)
def application_status_notification(
    sender, instance: InterventionApplication, created: bool, update_fields=None, **kwargs
):
    farmer_user = _farmer_recipient(instance.farmer)

    if created:
        # Notify the farmer that we received their application
        if farmer_user:
            Notification.objects.create(
                recipient=farmer_user,
                type=NotificationType.APPLICATION_SUBMITTED,
                title="Application received",
                body=f"Your application to {instance.program.name} was submitted and is awaiting review.",
                link="/app/applications",
            )
        # Notify staff/admin — bulk insert (C-5)
        _bulk_notify_staff(
            type_=NotificationType.APPLICATION_SUBMITTED,
            title="New application to review",
            body=f"{instance.farmer.full_name} applied to {instance.program.name}.",
            link="/staff/applications",
        )
        return

    # On update — only fire when status was actually changed (m-15)
    if not _status_changed(instance, update_fields):
        return

    if instance.status == ApplicationStatus.APPROVED and farmer_user:
        Notification.objects.create(
            recipient=farmer_user,
            type=NotificationType.APPLICATION_APPROVED,
            title="Application approved",
            body=f"Your application to {instance.program.name} was approved. Watch your Claims tab for the schedule.",
            link="/app/claims",
        )
    elif instance.status == ApplicationStatus.REJECTED and farmer_user:
        reason = instance.rejection_reason or "No reason was provided."
        Notification.objects.create(
            recipient=farmer_user,
            type=NotificationType.APPLICATION_REJECTED,
            title="Application not approved",
            body=f"Your application to {instance.program.name} was not approved. Reason: {reason}",
            link="/app/applications",
        )


# ---------------------------------------------------------------------------
# Distributions
# ---------------------------------------------------------------------------

@receiver(post_save, sender=Distribution)
def distribution_status_notification(
    sender, instance: Distribution, created: bool, update_fields=None, **kwargs
):
    farmer_user = _farmer_recipient(instance.farmer)
    if not farmer_user:
        return

    if created:
        date_str = instance.scheduled_date.strftime("%b %d, %Y") if instance.scheduled_date else "soon"
        Notification.objects.create(
            recipient=farmer_user,
            type=NotificationType.DISTRIBUTION_SCHEDULED,
            title="Pickup scheduled",
            body=f"Your {instance.program.name} pickup is scheduled for {date_str}.",
            link="/app/claims",
        )
        return

    # Only fire on genuine status changes (m-15)
    if not _status_changed(instance, update_fields):
        return

    if instance.status == DistributionStatus.DELIVERED:
        Notification.objects.create(
            recipient=farmer_user,
            type=NotificationType.DISTRIBUTION_DELIVERED,
            title="Pickup delivered",
            body=f"Your {instance.program.name} pickup is marked delivered. Please leave feedback.",
            link="/app/claims",
        )
    elif instance.status in (DistributionStatus.DELAYED, DistributionStatus.RESCHEDULED):
        Notification.objects.create(
            recipient=farmer_user,
            type=NotificationType.DISTRIBUTION_DELAYED,
            title="Pickup update",
            body=f"Your {instance.program.name} pickup is now {instance.get_status_display().lower()}.",
            link="/app/claims",
        )


# ---------------------------------------------------------------------------
# Quality-issue feedback — push a notification to staff (C-5, M-13)
# ---------------------------------------------------------------------------

@receiver(post_save, sender=Feedback)
def feedback_quality_notification(sender, instance: Feedback, created: bool, **kwargs):
    if not created or not getattr(instance, "is_quality_issue", False):
        return

    # M-13: use instance.farmer.full_name — farmer_name is a serializer field,
    # not a model attribute.  Guard against a null farmer FK.
    try:
        farmer_display = instance.farmer.full_name if instance.farmer else "A farmer"
    except Exception:
        farmer_display = "A farmer"

    _bulk_notify_staff(
        type_=NotificationType.QUALITY_ISSUE_REPORTED,
        title="Quality issue reported",
        body=f"{farmer_display} reported a quality issue ({instance.get_issue_type_display()}).",
        link="/staff/feedback",
    )
