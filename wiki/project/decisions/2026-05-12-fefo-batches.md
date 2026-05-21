---
title: FEFO (First-Expire-First-Out) Batch Selection
domain: project
type: decision
tags: [inventory, fefo, batches, expiry, stock-allocation]
updated: 2026-05-12
---

# FEFO (First-Expire-First-Out) Batch Selection

## Decision
When allocating inventory to a distribution, automatically select batches in **FEFO order** (earliest expiry date first). Do not allow staff to manually select batches; FEFO is mandatory.

## Context
BATC distributes agricultural inputs (seeds, fertilizers) to farmers. Inputs have:
- **Expiry dates** — seeds degrade, fertilizer loses potency
- **Lot/batch numbers** — track source, for compliance
- **Multiple batches in inventory** — constant flow of new stock, mixed with older stock

**Risk without FEFO:**
- Staff manually picks newer batches, leaving old ones to expire and waste
- No deterministic behavior — same allocation request could pick different batches
- Farmer receives near-expiry input (product quality issue)
- Audit questions: "Why was older batch not used?"

**FEFO benefit:**
- Wasted inventory is minimized
- Farmer always gets newest usable stock
- Deterministic (same request, same batch allocation)
- Auditable ("we always use earliest expiry first")

## Options Considered

| Approach | Manual Selection | Audit | Waste | Complexity | Chosen |
|---|---|---|---|---|
| A (chosen) | ❌ No, automatic | ✅ Full | ✅ Minimized | Medium | ✅ |
| B | ✅ Staff chooses | ⚠️ Gap | ❌ High | Simple | Rejected |
| C | Weighted by score | ✅ Complex | ✅ Good | High | Rejected — overkill |

## Rationale

### Mandatory FEFO Logic
```python
def get_fefo_batches(item_id, qty_needed):
    """
    Return batches sorted by expiry_date ASC, enough to fulfill qty_needed.
    """
    batches = StockBatch.objects.filter(
        item_id=item_id,
        current_qty__gt=0
    ).order_by('expiry_date')
    
    allocation = []
    remaining = qty_needed
    for batch in batches:
        if remaining <= 0:
            break
        take = min(batch.current_qty, remaining)
        allocation.append((batch.id, take))
        remaining -= take
    
    return allocation  # [(batch_1, qty_1), (batch_2, qty_2), ...]
```
- **Deterministic** — same input always yields same output
- **SQL-friendly** — single index on `expiry_date` makes query fast
- **No business logic in staff heads** — algorithm is the source of truth

### Why Not Staff Selection?
```python
# DON'T DO THIS
distribution.item.user_selected_batch = staff_choice
# Staff forgets old batch, picks new one
# Old batch expires, wasted
```
- **Cognitive load** — staff must remember which batches are old
- **Inconsistent** — morning staff might decide differently from afternoon staff
- **Audit burden** — questions like "why batch 1 instead of batch 2?" are hard to answer

### Why Not Machine Learning?
```python
# DON'T DO THIS (for prototype)
score = (1 - expiry_urgency) * quality_score * cost_score
# Too complex for prototype; FEFO is sufficient
```
- **Prototype scope** — FEFO meets the domain requirement (minimize waste)
- **Future extension** — add scoring in Phase 7 if waste patterns emerge

## Consequences

### Enabled
✅ Older stock never bypassed (zero expiry waste)  
✅ Farmer receives fresh stock (quality perception)  
✅ Deterministic allocation (predictable, auditable)  
✅ No staff training needed ("always FEFO")  
✅ Batch history log shows allocation order  

### Constrained
⚠️ Staff cannot override FEFO (even if there's a business reason)  
⚠️ If expiry date is wrong, wrong batch is used (garbage-in-garbage-out)  
⚠️ No A/B testing of batch selection strategies (locked to FEFO)  

## Future Evolution
If constraints emerge:
1. **Exceptions:** Add `override_fefo_reason` field to Distribution; require ADMIN approval
2. **Scoring:** Add batch preference weights (expiry urgency, quality grade, supplier preference)
3. **Forecasting:** Predict future demand; pre-allocate FIFO-optimal batches

## Testing

1. **Create three batches of same item:**
   - Batch A: 5 kg, expires 2026-06-15
   - Batch B: 10 kg, expires 2026-08-01
   - Batch C: 8 kg, expires 2026-07-10
2. **Request 12 kg allocation:**
   - `get_fefo_batches(item_id, 12)` should return:
     - Batch A: 5 kg (expires soonest)
     - Batch C: 7 kg (next soonest)
     - *(Batch B not needed)*
3. **Verify order:** Assert `[(A, 5), (C, 7)]` not `[(C, 7), (A, 5)]`

---

**Session:** Phase 3 (programs and inventory)  
**Related:** [[2026-05-12-atomic-distribution.md]]
