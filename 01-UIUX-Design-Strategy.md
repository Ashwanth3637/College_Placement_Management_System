# Enterprise College Placement Portal — UI/UX Design Strategy

**Document type:** Phase 1 — Design Strategy
**Audience:** Product, Design, Engineering leadership, College Administration (client)
**Version:** 1.0
**Status:** For approval

---

## 0. How to Read This Document

Each major section ends with an **Implementation Priority** table using:

- **P0 — Critical path**: required for MVP launch; blocks other work
- **P1 — Near-term**: required within first 2 releases post-launch
- **P2 — Future enhancement**: roadmap item, not launch-blocking

Effort is expressed in **story points** (Fibonacci: 1, 2, 3, 5, 8, 13) assuming a cross-functional pod of 1 designer + 2 frontend engineers + 1 QA.

---

## 1. Design System Foundation

### 1.1 Brand Positioning

The portal should read as **institutional, trustworthy, and modern** — closer to a enterprise SaaS product (Workday, Greenhouse) than a consumer job board. It must feel authoritative enough for recruiters and admins, yet approachable enough for students on mobile.

### 1.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary-700` | `#0B3D91` | Primary brand, header bar, primary buttons (deep institutional blue) |
| `--color-primary-500` | `#1E5FCC` | Interactive elements, links, active nav state |
| `--color-primary-100` | `#E6EEFC` | Selected row / hover backgrounds |
| `--color-secondary-600` | `#0F766E` | Secondary actions, success-adjacent accents (teal) |
| `--color-accent-500` | `#F59E0B` | Highlights, badges, "new" indicators, CTAs needing attention |
| `--color-success-600` | `#15803D` | Offer accepted, verified, placed status |
| `--color-warning-600` | `#B45309` | Pending review, action required |
| `--color-danger-600` | `#B91C1C` | Rejected, errors, destructive actions |
| `--color-info-600` | `#0369A1` | Informational banners |
| `--color-neutral-900` | `#111827` | Primary text |
| `--color-neutral-600` | `#4B5563` | Secondary text |
| `--color-neutral-300` | `#D1D5DB` | Borders, dividers |
| `--color-neutral-100` | `#F3F4F6` | Page background |
| `--color-neutral-0` | `#FFFFFF` | Surface / card background |

Each semantic color has a 50–900 tint/shade ramp generated programmatically (not manually specified here) to support hover/active/disabled states consistently.

### 1.3 Typography Hierarchy

**Font families**
- Primary (UI + body): `Inter` (variable font) — excellent legibility at small sizes, wide language support
- Numerals/data-dense tables: `Inter` with tabular-nums feature enabled
- Monospace (IDs, codes, logs in Admin console): `JetBrains Mono`

**Scale (8px-aligned type scale)**

| Token | Size / Line-height | Weight | Usage |
|---|---|---|---|
| `display` | 36px / 44px | 700 | Marketing/landing hero only |
| `h1` | 28px / 36px | 700 | Page titles |
| `h2` | 22px / 30px | 600 | Section headers |
| `h3` | 18px / 26px | 600 | Card/panel titles |
| `body-lg` | 16px / 24px | 400 | Primary reading text |
| `body` | 14px / 20px | 400 | Default UI text, table cells |
| `caption` | 12px / 16px | 500 | Metadata, timestamps, helper text |
| `overline` | 11px / 16px | 600, uppercase, +0.06em tracking | Status chips, section eyebrows |

### 1.4 Spacing System (8px Grid)

Base unit = 8px. All margins, padding, and gaps use multiples of this unit to guarantee visual rhythm.

| Token | Value | Typical use |
|---|---|---|
| `space-1` | 4px | Icon-to-label gap (half-step, exception) |
| `space-2` | 8px | Tight component padding |
| `space-3` | 12px | Form field internal padding |
| `space-4` | 16px | Card padding, default gap |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Panel-to-panel spacing |
| `space-12` | 48px | Page-level top margin |
| `space-16` | 64px | Major section breaks |

### 1.5 Component Design Tokens

| Token | Value |
|---|---|
| `--radius-sm` | 4px (inputs, chips) |
| `--radius-md` | 8px (cards, buttons) |
| `--radius-lg` | 12px (modals, panels) |
| `--shadow-sm` | 0 1px 2px rgba(17,24,39,0.06) |
| `--shadow-md` | 0 4px 12px rgba(17,24,39,0.08) |
| `--shadow-lg` | 0 12px 32px rgba(17,24,39,0.12) |
| `--border-default` | 1px solid var(--color-neutral-300) |
| `--transition-default` | 150ms ease-in-out |

### Implementation Priority — Design System

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Color tokens + theming (light mode) | P0 | 3 | None |
| Typography scale + font loading | P0 | 2 | None |
| Spacing/grid utilities | P0 | 2 | None |
| Component tokens (radius/shadow) | P0 | 2 | Color tokens |
| Dark mode theming | P2 | 5 | Full token system |

---

## 2. Layout Architecture

### 2.1 Responsive Breakpoints

| Breakpoint | Width | Layout behavior |
|---|---|---|
| `mobile` | 320px – 767px | Single column, bottom tab bar replaces sidebar, collapsible header search |
| `tablet` | 768px – 1023px | Collapsible/icon-only sidebar, 2-column content where applicable |
| `desktop` | 1024px – 1439px | Full sidebar (240px), 12-column content grid |
| `wide` | 1440px+ | Sidebar + content max-width 1440px, centered, extra whitespace gutters |

Grid: 12-column, 24px gutters at desktop/wide, 16px at tablet, 8px at mobile.

### 2.2 Global Shell

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Global Search | Notifications | Avatar   │
├───────────┬─────────────────────────────────────────────┤
│           │                                             │
│  Sidebar  │           Main Content Area                 │
│  (nav)    │   Breadcrumb → Page Title → Actions → Body   │
│           │                                             │
└───────────┴─────────────────────────────────────────────┘
```

- **Header (64px height, fixed):** institution logo/wordmark left; global search (⌘K shortcut) center-left; notification bell with unread badge, help icon, and profile avatar dropdown (role switcher for admins impersonating, settings, logout) right.
- **Sidebar (240px expanded / 64px collapsed):** role-specific nav items with icon + label, active-state left border accent in `--color-primary-500`, collapsible via toggle, persists user preference.
- **Main content:** breadcrumb trail → page title + primary action button (top-right) → contextual filter bar → content body (table/cards/forms) → pagination footer.

### 2.3 Content Density Modes

Data-heavy roles (Placement Officer, Super Admin) get a **"Comfortable / Compact"** table density toggle, persisted per user, since these personas often triage large lists.

### Implementation Priority — Layout

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Responsive shell (header/sidebar/content) | P0 | 8 | Design tokens |
| Global search (⌘K palette) | P1 | 5 | Search API |
| Collapsible sidebar + persistence | P1 | 3 | Shell |
| Density toggle | P2 | 2 | Data table component |

---

## 3. Role-Based Dashboard Designs

### 3.1 Student Portal

**Home dashboard widgets (grid layout, reorderable in P2):**

1. **Profile Completion Widget** — circular progress ring (%), checklist of missing items (resume, skills, academic records, photo), CTA "Complete Profile."
2. **Job Listings + Filter Panel** — left filter rail (role type, CTC range, location, eligibility match %, company), card/list toggle, "eligible only" default filter, save-search capability.
3. **Application Tracking Timeline** — horizontal stepper per application: `Applied → Shortlisted → Test → Interview → Offer/Rejected`, color-coded, click-through to detail drawer.
4. **Interview Schedule Calendar** — month/week/agenda views, color-coded by company, ICS export, conflict warnings.
5. **Offer Letter Management** — card per offer (company, CTC, deadline countdown), accept/decline/hold actions, document viewer, e-sign placeholder.
6. **Skill Assessment Dashboard** — radar/bar chart of skill scores vs. role requirements, links to recommended prep resources.

**Layout note:** Widgets 1 and 6 are compact (sidebar-width cards); 2–5 are full-width sections stacked below, each collapsible.

### 3.2 Placement Officer Dashboard

1. **Company Relationship Management (CRM) Table** — sortable/filterable table (company name, sector, relationship owner, last contact, active drives, historical hires), row expand for contact history log.
2. **Placement Drive Creation Wizard** — 5-step wizard: (1) Company & role details → (2) Eligibility criteria builder (CGPA, branch, backlog rules) → (3) Rounds/timeline → (4) Student pool preview (auto-filtered count) → (5) Review & publish. Progress indicator at top, save-as-draft at every step.
3. **Student Shortlisting Interface** — split view: left = filterable/sortable candidate list with bulk checkboxes; right = candidate detail preview pane; bulk actions (shortlist, reject, move to next round) with confirmation modal.
4. **Interview Scheduling Board** — Kanban-style board (columns = interview rounds) with drag-and-drop candidate cards, slot capacity indicators, conflict detection against student's other interviews.
5. **Analytics Overview** — KPI cards (placement %, avg. CTC, offers this week, active drives) + trend charts (placements over time, department-wise breakdown).
6. **Communication Center** — bulk notification composer (audience segment builder, template picker, email/SMS/in-app channel toggle), send history with open/click stats.

### 3.3 Super Admin Console

1. **System Configuration Panel** — tabbed settings: General (institution branding, academic calendar), Placement Rules (default eligibility templates), Feature Flags.
2. **User Management** — table of all users with role badges, status (active/suspended), bulk role assignment, impersonation ("view as") for support, invite-by-CSV.
3. **Audit Logs Viewer** — filterable, immutable log table (actor, action, entity, timestamp, IP), export to CSV, retention policy indicator.
4. **Placement Season Management** — season lifecycle control (create → activate → freeze → archive), season-scoped data isolation, rollover wizard to clone rules into next season.
5. **Global Analytics with Exportable Reports** — cross-department, cross-season dashboards; scheduled report builder (recipients, cadence, format PDF/XLSX).
6. **Integration Settings** — third-party connectors (LMS, resume parser, video interview, email/SMS gateway) with connection status, API key management, test-connection action.

### Implementation Priority — Dashboards

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Student: profile completion + job listings | P0 | 8 | Auth, Job API |
| Student: application timeline | P0 | 5 | Application API |
| Student: interview calendar | P1 | 5 | Interview API |
| Student: offer management | P0 | 5 | Offer API |
| Student: skill assessment view | P2 | 5 | Assessment service |
| PO: CRM table | P0 | 8 | Company API |
| PO: drive creation wizard | P0 | 13 | Eligibility engine |
| PO: shortlisting interface | P0 | 8 | Application API |
| PO: interview scheduling board | P1 | 8 | Interview API |
| PO: analytics overview | P1 | 5 | Analytics API |
| PO: communication center | P1 | 8 | Notification engine |
| Admin: user management | P0 | 8 | RBAC |
| Admin: audit logs | P1 | 5 | Audit logging service |
| Admin: season management | P0 | 8 | Season data model |
| Admin: global analytics/export | P1 | 8 | Reporting API |
| Admin: integration settings | P2 | 5 | Integration services |

---

## 4. Authentication Flows

- **Login page:** institutional branding (logo, tagline, hero illustration or campus imagery), email/roll-number + password fields, "Remember Me" checkbox (extends refresh token lifetime, not session bypass), SSO button placeholder ("Continue with Institution SSO"), forgot-password link.
- **MFA setup:** post-login prompt (skippable N times based on admin policy) for authenticator app QR enrollment or SMS OTP; recovery codes shown once, downloadable.
- **Password recovery:** email-based reset link (15-min expiry), rate-limited, generic success message regardless of account existence (prevents enumeration).
- **Session management:** visible "Active Sessions" panel in account settings (device, location, last active), remote sign-out capability.
- **SSO integration placeholder:** SAML/OIDC button on login screen, routed to institution IdP when configured; falls back to standard login otherwise.

### Implementation Priority — Auth Flows

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Login + password recovery UI | P0 | 5 | Auth API |
| Remember Me / session UI | P1 | 3 | Auth API |
| MFA setup UI | P1 | 5 | MFA backend |
| Active sessions management | P2 | 3 | Session API |
| SSO button + redirect flow | P2 | 3 | SAML/OIDC backend |

---

## 5. Shared Components Library

| Component | Key states / notes |
|---|---|
| **Data table** | Sort (asc/desc/none), column filter, global search, pagination (client + server modes), row selection, sticky header, empty/loading/error states |
| **Form elements** | Default, focus, error (with inline message + icon), disabled, success validation tick; consistent 44px min touch target |
| **Modal dialogs** | Confirmation, form, full-screen (mobile), focus-trapped, ESC to close, backdrop click configurable |
| **Toast notifications** | Success/error/warning/info variants, auto-dismiss (5s) with manual dismiss, stacked queue, top-right desktop / top mobile |
| **Empty states** | Illustration + message + primary action (e.g., "No applications yet — Browse jobs") |
| **Loading skeletons** | Shape-matched to final content (table rows, cards) to avoid layout shift |
| **File upload zone** | Drag-and-drop + click-to-browse, file type/size validation inline, progress bar, virus-scan pending state |
| **Date/time pickers** | Range selection support, timezone-aware for interview scheduling, keyboard-navigable |
| **Status chips/badges** | Semantic color-coded (applied/shortlisted/offered/rejected/placed) |
| **Stepper/wizard** | Horizontal for desktop, vertical/collapsed for mobile |

### Implementation Priority — Component Library

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Data table (core) | P0 | 8 | Design tokens |
| Form elements + validation | P0 | 5 | Design tokens |
| Modal + toast system | P0 | 5 | Design tokens |
| Empty states + skeletons | P1 | 3 | Component base |
| File upload zone | P0 | 5 | Storage API |
| Date/time pickers | P1 | 5 | — |
| Stepper/wizard | P0 | 5 | — |

---

## 6. Accessibility Standards (WCAG 2.1 AA)

**Checklist**
- [ ] Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text/icons (all palette combinations audited)
- [ ] All interactive elements reachable via keyboard (Tab/Shift+Tab), logical tab order
- [ ] Visible focus indicator (2px outline, `--color-primary-500`, 2px offset) on every focusable element
- [ ] Skip-to-content link on every page
- [ ] Form fields programmatically associated with labels (`<label for>` / `aria-labelledby`)
- [ ] Error messages announced via `aria-live="polite"`; critical alerts `aria-live="assertive"`
- [ ] Data tables use proper `<th scope>` and caption/summary
- [ ] Modals trap focus and return focus to trigger element on close
- [ ] Images/icons carry `alt` text or `aria-hidden` if purely decorative
- [ ] Minimum touch target 44x44px on mobile
- [ ] No information conveyed by color alone (status chips pair color + icon + text)
- [ ] Reduced-motion preference respected for animations/transitions

**Screen reader annotations:** each dashboard widget documented with expected `aria-label`/`role` (e.g., calendar → `role="grid"`, wizard steps → `aria-current="step"`).

### Implementation Priority — Accessibility

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Contrast audit + fixes | P0 | 3 | Color tokens |
| Keyboard nav + focus states | P0 | 5 | Component library |
| ARIA labeling pass | P0 | 5 | All components |
| Reduced-motion support | P2 | 2 | Animation system |
| Full screen-reader QA pass | P1 | 5 | Feature-complete UI |

---

## 7. Client Presentation Strategy

### 7.1 Annotated Wireframes with Business Value Callouts

Each wireframe delivered to the client should carry callout labels tying UI elements to outcomes, e.g.:
- Eligibility-filtered job list → *"Reduces irrelevant applications by ~40%, cutting officer screening time."*
- Bulk communication center → *"Enables one-to-many company outreach, replacing manual email threads."*
- Analytics overview → *"Gives placement cell leadership real-time visibility for NAAC/NBA accreditation reporting."*

### 7.2 Competitive Analysis

| Dimension | LinkedIn (Jobs) | Naukri | Typical Legacy Institutional Portal | This Portal |
|---|---|---|---|---|
| Role-based workflows (student/officer/admin) | No | No | Partial, often manual | Full native workflow |
| Eligibility auto-filtering | No | Basic | Rare | Rule-based engine (P0) |
| Interview scheduling automation | No | No | Manual/email | Kanban board + conflict detection |
| Analytics/reporting for accreditation | No | No | Manual spreadsheets | Built-in exportable reports |
| Mobile-first student experience | Yes | Yes | Rare | Yes (responsive from day 1) |
| Data ownership/privacy | Vendor-controlled | Vendor-controlled | Institution-controlled but siloed | Institution-controlled, centralized |

### 7.3 ROI Projections (illustrative — validate with client's actuals)

| Metric | Current (manual/legacy) | Projected with Portal | Basis |
|---|---|---|---|
| Officer hours/week on shortlisting | ~15 hrs | ~5 hrs | Bulk filtering + automation |
| Time-to-schedule interviews | 2–3 days | Same-day | Scheduling board + notifications |
| Placement reporting turnaround | 1–2 weeks (manual compilation) | Real-time | Analytics module |
| Student application drop-off (unclear status) | Higher, anecdotal | Reduced | Timeline + notifications visibility |

*Note: These are directional estimates for the pitch; recommend validating with the institution's current process metrics before quoting hard numbers to the client.*

### 7.4 Implementation Timeline (Illustrative, 1 pod)

| Phase | Duration | Milestone |
|---|---|---|
| Discovery & design system | 2 weeks | Approved design system + wireframes |
| Core shell + auth | 2 weeks | Login, RBAC shell, navigation live in staging |
| Student portal MVP | 3 weeks | Profile, jobs, applications, offers |
| Placement Officer MVP | 3 weeks | CRM, drive wizard, shortlisting |
| Super Admin MVP | 2 weeks | User mgmt, season mgmt |
| Analytics + notifications | 2 weeks | Dashboards + email/in-app notifications |
| Hardening + accessibility QA | 2 weeks | WCAG AA pass, load testing |
| UAT + launch | 1 week | Go-live |

**Total: ~17 weeks to first production launch** (P0 scope only; P1/P2 items roll into subsequent releases).

### 7.5 Risk Mitigation for Client Approval

| Risk | Mitigation |
|---|---|
| Client stakeholders disagree on scope mid-design | Lock a signed-off scope doc before Phase 1 visual design begins; change requests go through a lightweight CR log |
| Perceived complexity/cost of RBAC + wizard flows | Present phased P0/P1/P2 roadmap so client sees a working MVP early, not an all-or-nothing ask |
| Data migration from legacy spreadsheets/portal | Propose a dedicated migration sprint with sample-data dry run before cutover |
| Accessibility/compliance concerns from institution | Lead with the WCAG AA checklist and audit plan in the pitch itself, not as an afterthought |
| Vendor lock-in concerns (SSO/LMS integration) | Present integrations as pluggable adapters, not hard dependencies |

### Implementation Priority — Client Presentation Assets

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Annotated wireframes deck | P0 | 5 | Core dashboard designs |
| Competitive analysis doc | P1 | 2 | — |
| ROI projection slide | P1 | 2 | Client process data |
| Timeline/roadmap slide | P0 | 2 | Full priority tables above |

---

## 8. Cross-Reference: UI ↔ Backend Dependency Summary

This table exists to keep design and engineering synchronized; see the companion **Backend Functionality Document** for API-level detail.

| UI Component | Depends on Backend Service |
|---|---|
| Job listings + filters | Job Posting API, Eligibility Engine |
| Application timeline | Application Workflow API |
| Interview calendar / scheduling board | Interview Slot Allocation API |
| Offer management | Offer Management API |
| CRM table | Company Profile API |
| Drive creation wizard | Eligibility Criteria Engine, Job Posting API |
| Communication center | Notification Engine (Email/SMS/in-app) |
| Analytics dashboards (all roles) | Reporting & Analytics API |
| User management | Auth & RBAC Module |
| Audit logs viewer | Audit Logging Service |
| Integration settings | Integration Adapter Layer |

---

*End of Phase 1 document. See `02-Backend-Functionality.md` for system architecture and API specifications.*
