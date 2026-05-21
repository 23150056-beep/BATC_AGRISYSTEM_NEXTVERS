---
title: Atomic Distribution Allocation & Inventory Decrement
domain: project
type: decision
tags: [distribution, inventory, transactions, atomic, fefo, stock-management]
updated: 2026-05-12
---

# Atomic Distribution Allocation & Inventory Decrement

## Decision
When a **Distribution is marked DELIVERED**, the system must **atomically**:
1. Allocate stock from available batches using FEFO (First-Expire-First-Out) order
2. Decrement `InventoryItem.current_qty`
3. Create a `StockMovement` audit record
4. Mark the `InterventionApplication` as FULFILLED

All four operations must succeed or rollback together. If any fails, the entire transaction fails.

## Context
The BATC system tracks finite resources (seeds, fertilizers) distributed to farmers. Each resource has:
- Multiple batches (lot numbers, expiry dates, source)
- A current quantity (`current_qty`)
- Allocations to pending distributions

**Risk without atomicity:**
- Inventory is decremented but distribution is not marked delivered (double-dispatch risk)
- Two concurrent distributions allocate the same batch (overselling)
- Stock movement not logged (audit gap)
- Application not marked fulfilled (farmer sees delivery pending forever)

**Why FEFO matters:**
- Seeds/inputs expire; earliest-expiring batches must be used first or they're wasted
- `InventoryBatch.expiry_date` orders the allocation
- Predictable behavior for staff (no manual re-sorting of batches)

## Options Considered

| Approach | Atomicity | Complexity | Auditability | Chosen |
|---|---|---|---|---|
| A (chosen) | ✅ DB transaction | Medium | ✅ Full | ✅ |
| B | Manual locking | High | ⚠️ Incomplete | Rejected |
| C | No atomicity | ✅ Simple | ❌ Gaps | Rejected — risky |

## Rationale

### Database Transaction (`@transaction.atomic`)
```python
@transaction.atomic
def update_distribution_status(distribution, new_status):
    if new_status == DELIVERED:
        # 1. Allocate stock (FEFO order)
        batches = get_fefo_batches(distribution.item, distribution.qty)
        for batch in batches:
            allocate_from_batch(batch, qty)
        
        # 2. Decrement inventory
        InventoryItem.objects.filter(pk=item_id).update(
            current_qty=F('current_qty') - distribution.qty
        )
        
        # 3. Log movement
        StockMovement.objects.create(
            item=distribution.item,
            movement_type='RELEASE',
            qty=-distribution.qty,
            reference_distribution=distribution
        )
        
        # 4. Mark application fulfilled
        distribution.application.status = FULFILLED
        distribution.application.save()
        
        # 5. Update distribution
        distribution.status = DELIVERED
        distribution.save()
```
- **All-or-nothing** — if any line fails, entire block rolls back (no partial updates)
- **FEFO logic isolated** — `get_fefo_batches()` runs once per delivery (not on every query)
- **Audit trail** — every allocation, every decrement, every status change is logged
- **F() expression prevents race conditions** — `current_qty=F('current_qty') - qty` is atomic in SQL

### Why Not Manual Locking?
```python
# DON'T DO THIS
item = InventoryItem.objects.select_for_update().get(pk=item_id)
item.current_qty -= qty
item.save()
# Row is unlocked; concurrent request squeezes in here
```
- **Deadlock risk** — lock conflicts between multiple distributions
- **Lock held too long** — if FEFO batch lookup takes time, other operations stall
- **Doesn't prevent application status divergence** — lock is on item, not on distribution + application pair

## Consequences

### Enabled
✅ No double-distribution of same batch  
✅ No negative stock  
✅ Audit trail is complete (no "gap" in what happened)  
✅ Rollback is automatic if any step fails  
✅ **Integrity constraint** enforced by database, not by app logic  

### Constrained
⚠️ Slower than non-atomic updates (slight DB latency)  
⚠️ Requires all four operations to complete quickly (timeouts possible on slow DB)  
⚠️ Doesn't prevent concurrent distributions of different items (expected behavior)  

## Testing

1. **Create distribution for 10 kg of seeds**
   - Inventory: 20 kg, one batch expiring 2026-06-01
2. **Mark distribution DELIVERED**
   - `POST /distributions/{id}/update-status/ {status: DELIVERED}`
3. **Assert:**
   - `InventoryItem.current_qty == 10` (down from 20)
   - `StockMovement` record created with qty=-10
   - `Distribution.status == DELIVERED`
   - `Application.status == FULFILLED`
   - Batch allocation record exists
4. **Rollback test:**
   - Mock `StockMovement.objects.create()` to raise error
   - Retry same delivery
   - Assert `current_qty` still 20 (rolled back)

---

**Session:** Phase 4 (applications and distribution)  
**Related:** [[2026-05-12-fefo-batches.md]], [[2026-05-12-stack-choice.md]]
