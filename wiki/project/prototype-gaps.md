---
title: Prototype Gaps & Improvement Opportunities
domain: project
type: overview
tags: [gaps, improvements, demo, polish, ux, roadmap]
updated: 2026-05-12
---

# Prototype Gaps & Improvement Opportunities

This page documents gaps that hurt the prototype's demo credibility. None require production infrastructure — all are cosmetic/UX polish or simple feature additions.

## 🎯 Looks Unfinished (First 60 Second Impression)

### G1: Default Vite Starter Still in App.tsx
**Current:** `src/App.tsx` renders React + Vite hero, spinning logos, "Edit src/App.tsx and save to test HMR".  
**Why it matters:** Signals "scaffold, not product" to anyone reading source.  
**Fix:** Delete App.tsx hero; router is the entry point. Remove hero.png, react.svg, vite.svg.

### G2: Three Layouts, Three Visual Languages
**Current:**
- Admin: 160px dark navy sidebar, text-xs labels, no header
- Staff: 44px white icon-only rail, light theme, breadcrumb topbar
- Client: dark navy header, white bottom tabs, mobile cards

**Why it matters:** Same product, looks like three different apps.

**Fix:** One `AppShell` component with role-based density:
- Admin: full sidebar (icons + labels) + top header (breadcrumb / search / notifications / profile)
- Staff: same shell, sidebar collapsed to icons-only, expandable
- Client: same shell, sidebar hidden, replaced with sticky header + bottom tabs

### G3: Hardcoded Colors Everywhere
**Current:** Hex literals (#162036, #3B6D11, etc.) inline in JSX across all pages.  
**Why it matters:** Inconsistency; defeats themability.

**Fix:** Move all colors to tokenized block in `src/index.css`. Replace all inline hex with CSS variables.

### G4: Empty/Loading States are Placeholder Text
**Current:** "Loading…", "No announcements at this time" — plain gray italics, no illustration, no action.  
**Why it matters:** Feels unfinished; dismisses user request.

**Fix:** 
- Replace with small SVG illustrations + microcopy
- Skeleton loaders with shimmer (admin dashboard has blank gray boxes, not shimmers)
- Primary action on empty (e.g., "Walang programa pa. Tingnan muli mamaya." + Refresh button)

### G5: Typography Too Small
**Current:** `text-xs` (12px) used for sidebar labels, breadcrumbs, secondary lines.  
**Why it matters:** Uncomfortable for low-vision users; domain is older farmers.

**Fix:** Bump base size to `text-sm` (14px); preserve hierarchy with weight, not size.

---

## 📵 Core Flows Have Dead Ends

### G6: No "My Applications" View
**Current:** Client sees Programs and Claims, but no in-between state (SUBMITTED, UNDER_REVIEW, REJECTED with reason).  
**Impact:** "What happened to my application?" query hits dead end.

**Fix:** Add `/app/applications` tab showing application status pipeline with rejection reasons (if any).

### G7: Apply Now is Fire-and-Forget
**Current:** No confirmation modal; no eligibility-failure message.  
**Impact:** Farmer applies, nothing visible. No feedback on ineligibility.

**Fix:** 
- Modal showing entitlements ("Ibibigay: 5kg seeds")
- Show eligibility failure reason if ineligible (e.g., "Farm area < 0.5ha")

### G8: Programs Page Hides Ineligible Programs Entirely
**Current:** `eligible_for_me=true` filters to eligible only.  
**Impact:** Reviewer cannot see why a farmer doesn't qualify.

**Fix:** Show all programs; badge ineligible ones with "You don't qualify because: farm area < 0.5ha" + expandable criteria.

### G9: No Program Detail Screen
**Current:** Programs are list-only; no way to see items, criteria, source agency, schedule.  
**Impact:** "What am I actually getting?" is unanswerable.

**Fix:** Program detail modal/drawer showing items, batch details, eligibility criteria breakdown, source.

### G10: No Client Profile Editing
**Current:** Client can view profile; Staff edits through Staff portal.  
**Impact:** Breaks self-service narrative; farmers cannot update their own data.

**Fix:** Add "Edit Profile" button on Client profile page (opens 3-step wizard); staff can also edit.

### G11: Distribution Day Flow is Desk-Shaped
**Current:** BulkAllocateDialog + StatusUpdateDialog on desktop. No field staff flow.  
**Impact:** Staff in field cannot use system on phone; no barcode/QR confirmation.

**Fix:** 
- Mobile-first "Today's Pickups" view for staff (list of distributions to deliver today)
- Tap to expand distribution, confirm receipt
- Barcode/QR scanner mockup (no real scanner, but show the surface)

### G12: No FEFO Selection Visible
**Current:** Batches exist with `expiry_date`; allocation silently picks earliest without showing user.  
**Impact:** Staff doesn't trust allocation; appears "magical".

**Fix:** Show FEFO logic on BulkAllocate: "Allocating Batch A (expires 2026-06-15) then Batch B (expires 2026-08-01)".

### G13: Application Review Panel Doesn't Show Eligibility Breakdown
**Current:** Staff sees app, clicks approve/reject. No visibility into which criteria passed/failed.  
**Impact:** Reviewers have to trust the system; cannot explain rejection to farmer.

**Fix:** Show checkbox list on app detail: "✅ Farm area ≥ 0.5ha" "❌ Is 4Ps beneficiary". Show rejection reason field (required if rejecting).

### G14: Admin Sidebar is Missing Everything
**Current:** Admin layout has no top header, no profile menu, no logout visible, no breadcrumb, no global search.  
**Impact:** Feels minimalist; unclear if user is logged in.

**Fix:** Add top header with: BATC logo | breadcrumb | notifications | search | user menu | logout.

### G15: Dashboards Are Stat Cards Only
**Current:** Admin/Staff dashboards show 6–8 metric cards. No trends, no charts, no map.  
**Impact:** Cannot answer "which barangay is underserved?" or "are we trending up?".

**Fix:** 
- Line chart: Farmer registrations / week (12 weeks)
- Bar chart: Applications by status (stacked, 8 weeks)
- Bar chart: Inventory by category + low-stock count
- Use Recharts (small, React 19 compatible)

### G16: No Audit Log UI
**Current:** `apps/audit` exists with ActionLog model; no `/admin/audit` page or signals connecting model changes.  
**Impact:** Audit trail is invisible; compliance story is missing.

**Fix:** 
- Add `/admin/audit` page with paginated ActionLog table (user, action, object_type, old/new values, timestamp)
- Connect signals to log all model changes automatically

### G17: Barangay Model is Unused Duplicate
**Current:** `apps/geo.Barangay` exists but is unused; `farmers/constants.py` has hardcoded list duplicating geo module.  
**Impact:** Code smell; confusion about canonical barangay list.

**Fix:** Use `geo.Barangay` as FK on Farmer; remove hardcoded list; seed geo data in `seed_demo`.

---

## 🔔 "Feels Real" — Out-of-Band Workflows

### G18: No Notifications Surface
**Current:** When application approved or distribution scheduled, farmer sees nothing in-app.  
**Impact:** User has to keep checking; no real-time feedback.

**Fix:** 
- Add bell icon in unified header with dropdown
- Create simple `Notification` model (actor, recipient, type, payload, read_at)
- Generate via post_save signals on Application / Distribution
- Show SMS preview: "🛈 SMS would be sent: Your application to Rice 2026 was approved"

### G19: No Password Reset Flow
**Current:** Anyone locked out is stuck; no "forgot password".  
**Impact:** Demo cannot recover from forgotten password.

**Fix:** Add `/auth/forgot-password` → email token (mock; show token in toast) → `/auth/reset-password?token=X` → new password.

### G20: No Tagalog i18n
**Current:** Entire system is English.  
**Impact:** Client portal serves farmers; labels confusing to non-English speakers.

**Fix:** Add i18next with Filipino (Tagalog) translations for Client role. Admin/Staff stay English (technical users).

### G21: Login UX is Generic
**Current:** No "show password" toggle, no "remember me", labels say "Username" (farmers think "mobile number").  
**Impact:** New users struggle; demo friction.

**Fix:** 
- Show/hide password toggle
- Remember device option (cookie)
- Label: "Mobile Number or Username"

### G22: No Voucher/Printable Artifact
**Current:** Confirmed distribution exists in app, but farmer cannot print a voucher.  
**Impact:** "How does farmer show staff they are here?" is unanswered.

**Fix:** 
- "Download Voucher (PDF)" button on confirmed distribution
- Client-side HTML→print template (no server PDF lib needed)
- Include QR code (qrcode.react) encoding distribution ID
- Shows staff-scan story without building scanner

### G23: No Believable Demo Seed
**Current:** `seed_demo.py` is sparse; `seed_rich_demo` exists but unclear if complete.  
**Impact:** Demo starts empty; has to build up credibility from scratch.

**Fix:** Ensure `seed_rich_demo` produces:
- 30+ farmers across 5+ barangays with varied demographics
- 3 programs with distinct eligibility criteria
- Mixed application statuses (approved, rejected with reason, pending)
- At least one quality-issue feedback (red badge lights up)
- Add "Reset demo data" button on Admin → Settings to re-run seeder mid-demo

### G24: Login Throttle Not Visible
**Current:** Rate limit is configured but user doesn't see lockout banner.  
**Impact:** After 5 failed attempts, 6th attempt fails silently; user thinks password is wrong.

**Fix:** 
- Show lockout banner: "Too many attempts. Try again in 60 seconds."
- Countdown timer in banner
- Clear explanation

---

## 📐 Suggested Architecture Improvements

### Unified AppShell (Highest ROI)
Replace three layouts with one `AppShell` taking a `role` prop. Differences are density + visibility (sidebar width, header height, navigation placement) — content stays the same.

**Before:** 3 separate layouts, visual inconsistency  
**After:** 1 shell × 3 modes, unified visual language  
**Time:** ~1 day of refactoring

### Tokenized Theme
Move all hex literals to CSS variables in `src/index.css`.

**Before:** #162036 inline in 20 places  
**After:** var(--batc-navy-sidebar) in all 20 places  
**Benefit:** Trivial dark-mode later, consistency enforcement  
**Time:** ~2 hours

### Notification Model + Signals
Simple `Notification` table + post_save signals on Application/Distribution.

**Benefit:** SMS preview story works; foundation for future SMS/email  
**Time:** ~3 hours

### Recharts Integration
Three simple charts on existing dashboards.

**Benefit:** Reviewers can see trends, "answer" questions about data  
**Time:** ~4 hours

---

## Priority Roadmap

### Phase 7 (Demo Polish — 2–3 days)
- [ ] Fix G1, G2, G3 (visual coherence)
- [ ] Add G18 (notifications)
- [ ] Add G22 (voucher printable)
- [ ] Fix critical bugs #1–#7 from known-bugs-and-issues.md

### Phase 8 (UX Gaps — 3–4 days)
- [ ] Fix G6–G10, G13 (client flow completeness)
- [ ] Add G15 (charts)
- [ ] Add G16 (audit UI)
- [ ] Fix major bugs #11–#18 from known-bugs-and-issues.md

### Phase 9 (Internationalization & Polish)
- [ ] G20 (Tagalog i18n for Client)
- [ ] G21 (login UX)
- [ ] G24 (throttle visibility)

### Phase 10+ (Field & Scale)
- [ ] G11 (mobile field staff flow)
- [ ] G12 (FEFO visibility)
- [ ] Real barcode scanning
- [ ] SMS/email real integration

---

**Source:** `batc/_gaps.txt` (prototype audit for demo credibility)  
**Updated:** 2026-05-12
