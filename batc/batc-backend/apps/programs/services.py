from decimal import Decimal
from apps.farmers.models import Farmer
from apps.programs.models import Program, EligibilityCriterion, CriterionOperator, ProgramStatus


def get_eligible_farmers(program: Program):
    """
    Returns a Farmer queryset filtered by the program's target_barangays
    and every EligibilityCriterion.
    """
    qs = Farmer.objects.filter(is_archived=False)

    if program.target_barangays:
        qs = qs.filter(barangay__in=program.target_barangays)

    for criterion in program.criteria.all():
        qs = _apply_criterion(qs, criterion)

    return qs


def get_eligible_programs_for(farmer: Farmer):
    """
    Returns IDs of ACTIVE programs this farmer is eligible for.

    Avoids the original N+1 pattern (one DB query per program):
    - Scopes to ACTIVE programs only (skips DRAFT / SUSPENDED / COMPLETED).
    - Applies the barangay gate in Python before issuing any DB criteria query.
    - Runs criteria against a *single-row* queryset (pk=farmer.pk) so no
      full-table scan is triggered per program.
    - criteria.all() hits the prefetch cache — no extra queries inside the loop.
    """
    eligible_ids: list[int] = []

    # Single prefetch pass: one query for programs + one for all related criteria
    programs = (
        Program.objects
        .filter(status=ProgramStatus.ACTIVE)
        .prefetch_related("criteria")
    )

    # Base queryset for this specific farmer (reused per loop iteration)
    farmer_base = Farmer.objects.filter(pk=farmer.pk, is_archived=False)

    for program in programs:
        # Fast-path: barangay gate (pure Python, no DB hit)
        if program.target_barangays and farmer.barangay not in program.target_barangays:
            continue

        # Apply every criterion against the single-farmer queryset
        qs = farmer_base
        for criterion in program.criteria.all():  # served from prefetch cache
            qs = _apply_criterion(qs, criterion)

        if qs.exists():
            eligible_ids.append(program.pk)

    return eligible_ids


def _apply_criterion(qs, criterion: EligibilityCriterion):
    field = criterion.field
    op = criterion.operator
    value = criterion.value

    if op == CriterionOperator.IS_TRUE:
        return qs.filter(**{field: True})

    if op == CriterionOperator.EQ:
        if value == "":
            return qs
        return qs.filter(**{field: value})

    if op == CriterionOperator.GTE:
        try:
            return qs.filter(**{f"{field}__gte": Decimal(value)})
        except Exception:
            # M-14: bad value → no farmers pass, not all farmers pass.
            # Return none() so an invalid criterion never silently grants eligibility.
            return qs.none()

    if op == CriterionOperator.LTE:
        try:
            return qs.filter(**{f"{field}__lte": Decimal(value)})
        except Exception:
            return qs.none()  # M-14: same guard

    return qs
