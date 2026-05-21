---
title: JWT Authentication with 15-Minute Access Tokens
domain: project
type: decision
tags: [auth, jwt, security, access-control, simplejwt]
updated: 2026-05-12
---

# JWT Authentication with 15-Minute Access Tokens

## Decision
Implement **SimpleJWT** with:
- **15-minute access token** lifetime
- **7-day refresh token** lifetime  
- **Token rotation** on refresh (new refresh token issued each time)
- **Blacklist on logout** (prevents reuse of old refresh tokens)

## Context
The BATC system manages sensitive agricultural program data and farmer applications. Authentication must:
- Support three distinct roles (ADMIN/STAFF/CLIENT) with different permissions
- Work across slow mobile networks (refresh should be fast)
- Allow future mobile app development (no session cookies)
- Prevent token reuse after logout or session end

## Options Considered

| Approach | Access TTL | Refresh TTL | Rotation | Logout | Risk |
|---|---|---|---|---|---|
| Long-lived JWT (no refresh) | 7 days | N/A | No | None | Leaked token usable for 7 days |
| Session cookies | Per-session | Per-session | Yes (implicit) | Yes | CSRF vulnerable; requires same-origin |
| **A (chosen)** | 15 min | 7 days | Yes | Blacklist | ✅ Good balance |
| B (paranoid) | 5 min | 1 day | Yes | Blacklist | Excessive refresh; worse UX |

## Rationale

### 15-Minute Access Token
- **Sweet spot** — limits exposure if token is stolen (attacker gets ~15 min of access)
- **User doesn't notice** — refresh happens silently in axios interceptor
- **Mobile-friendly** — 15 min is shorter than typical mobile app background timeout

### 7-Day Refresh Token
- **Matches common use** — "stay logged in for a week" is familiar to farmers
- **Blacklist feasible** — 10k farmers × 1 week = manageable in-memory or database set
- **Paired with rotation** — if refresh token compromised, new one issued; old one blacklisted

### Token Rotation on Every Refresh
- **Limits refresh token reuse** — if attacker intercepts a refresh, only the new token is usable
- **Database cost** — must track blacklist per refresh, but acceptable at scale

### Logout via Blacklist
- **Immediate** — prevents old refresh token from being reused
- **Future-proof** — if scaled to PostgreSQL, blacklist lives in a simple table with TTL index
- **No state in JWT** — token doesn't know it's blacklisted; backend checks on use

## Consequences

### Enabled
✅ Stolen access token expires in 15 minutes  
✅ Logout is immediate and permanent  
✅ Works with mobile apps (no same-origin restriction)  
✅ Refresh hidden from user (axios interceptor)  
✅ Audit trail possible (track refresh events)  

### Constrained
⚠️ Must manage blacklist (in-memory or database)  
⚠️ Cannot revoke access token mid-flight (must wait 15 min or log out)  
⚠️ Requires axios interceptor on frontend (boilerplate)  

## Implementation

**Backend** (`config/settings/base.py`):
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'TOKEN_TYPE_CLAIM': 'token_type',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
}
```

**Frontend** (`src/services/api/client.ts`):
- `POST /auth/login/` → returns `{access, refresh}`
- Store both in `authStore` (Zustand)
- `POST /auth/refresh/` automatically called on 401 response
- `POST /auth/logout/` → blacklists current refresh token
- axios interceptor retries once on 401 after refresh

## Testing

1. Get token: `POST /auth/login/ → {access, refresh}`
2. Use access: `GET /farmers/ → 200 OK`
3. Wait 15+ min (or mock clock)
4. Use old access: `GET /farmers/ → 401 Unauthorized`
5. Refresh: `POST /auth/refresh/{refresh} → {access: NEW, refresh: NEW}`
6. Logout: `POST /auth/logout/ → 200 OK`
7. Try old refresh: `POST /auth/refresh/{old_refresh} → 401 Unauthorized` (blacklisted)

---

**Session:** Phase 0 foundation  
**Related:** [[2026-05-12-rbac.md]]
