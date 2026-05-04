from django.db import transaction
from django.utils import timezone
from apps.applications.models import InterventionApplication, ApplicationStatus
from apps.programs.models import Program, ProgramStatus
from apps.programs.services import get_eligible_farmers
from apps.audit.models import log_action


@transaction.atomic
def submit_application(farmer, program: Program, by_user) -> InterventionApplication:
    """
    Submit a new application. Wrapped in @transaction.atomic so that the
    application row and its audit log entry are committed together — a DB
    hiccup on log_action no longer leaves an unaudited application behind
    (Finding #17).
    """
    if program.status != ProgramStatus.ACTIVE:
        raise ValueError("Program is not active.")

    if not get_eligible_farmers(program).filter(pk=farmer.pk).exists():
        raise ValueError("Farmer does not meet the program eligibility criteria.")

    if InterventionApplication.objects.filter(
        farmer=farmer,
        program=program,
        status__in=[ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED],
    ).exists():
        raise ValueError("A pending or approved application for this program already exists.")

    app = InterventionApplication.objects.create(farmer=farmer, program=program)
    log_action(by_user, "APPLICATION_SUBMITTED", app, notes=f"Farmer {farmer.pk} -> Program {program.pk}")
    return app


@transaction.atomic
def approve_application(application: InterventionApplication, reviewed_by) -> InterventionApplication:
    if application.status not in (ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW):
        raise ValueError(f"Cannot approve application in status '{application.status}'.")

    if not get_eligible_farmers(application.program).filter(pk=application.farmer.pk).exists():
        raise ValueError("Farmer no longer meets eligibility criteria.")

    application.status = ApplicationStatus.APPROVED
    application.reviewed_at = timezone.now()
    application.reviewed_by = reviewed_by
    application.save()

    # Import here to avoid circular; distribution created as side-effect
    from apps.distribution.services import create_distribution
    create_distribution(application, by_user=reviewed_by)

    log_action(reviewed_by, "APPLICATION_APPROVED", application)
    return application


@transaction.atomic
def reject_application(application: InterventionApplication, reason: str, reviewed_by) -> InterventionApplication:
    if application.status not in (ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW):
        raise ValueError(f"Cannot reject application in status '{application.status}'.")

    application.status = ApplicationStatus.REJECTED
    application.rejection_reason = reason
    application.reviewed_at = timezone.now()
    application.reviewed_by = reviewed_by
    application.save()
    log_action(reviewed_by, "APPLICATION_REJECTED", application, notes=reason)
    return application


@transaction.atomic
def cancel_application(application: InterventionApplication, by_user) -> InterventionApplication:
    allowed_statuses = [ApplicationStatus.SUBMITTED]
    if by_user.is_admin or by_user.is_staff_role:
        allowed_statuses.append(ApplicationStatus.UNDER_REVIEW)

    if application.status not in allowed_statuses:
        raise ValueError(f"Cannot cancel application in status '{application.status}'.")

    application.status = ApplicationStatus.CANCELLED
    application.save()
    log_action(by_user, "APPLICATION_CANCELLED", application)
    return application
