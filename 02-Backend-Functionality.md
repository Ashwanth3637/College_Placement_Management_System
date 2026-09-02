# Enterprise College Placement Portal — Backend Functionality Document

**Document type:** Phase 2 — System Architecture & API Specification
**Audience:** Engineering leadership, Backend/DevOps teams, Technical evaluators
**Version:** 1.0
**Status:** For approval

---

## 0. Priority & Estimation Legend

- **P0 — Critical path** (blocks MVP launch)
- **P1 — Near-term** (first 2 post-launch releases)
- **P2 — Future enhancement**

Effort in story points (Fibonacci) for a pod of 3 backend engineers + 1 DevOps + 1 QA.

---

## 1. System Architecture

### 1.1 Microservices vs. Monolithic — Recommendation

**Recommendation: Modular monolith at launch, with service boundaries designed for future extraction.**

Justification:
- The domain (students/officers/admins, single institution or small multi-tenant set) does not yet have the independent scaling or team-autonomy pressures that justify microservices' operational overhead.
- A modular monolith — organized into clearly bounded modules (Auth, Student, Placement Officer, Admin, Notification, Analytics, Integration) each behind an internal service interface — gives 80% of the maintainability benefit of microservices with far lower deployment/observability complexity for a small-to-mid engineering team.
- Modules are built so that any one (e.g., Notification Engine, Analytics) can be **extracted into a standalone service later** without a rewrite, once load or team size justifies it (e.g., analytics workloads or resume parsing are natural first extraction candidates due to differing scaling profiles).

| Consideration | Monolith (modular) | Microservices |
|---|---|---|
| Team size fit (est. 3–6 engineers) | Good fit | Overhead-heavy |
| Operational complexity | Low | High (service mesh, distributed tracing) |
| Deployment simplicity | Single pipeline | Multiple pipelines |
| Future scaling of hot paths (analytics, notifications) | Extract later | Native |
| **Decision** | **Adopt at launch** | Revisit post-scale |

### 1.2 Tech Stack Proposal

| Layer | Choice | Rationale |
|---|---|---|
| Backend runtime | **Node.js (NestJS)** | Strong typing (TypeScript), modular architecture maps directly to NestJS's module system, large ecosystem for auth/queueing |
| Alternative | Python (FastAPI) | Equally valid if team has stronger Python bench strength; async support, good for ML-adjacent features (predictive analytics, resume parsing) |
| Primary database | **PostgreSQL** | Relational integrity for core entities (users, applications, offers) with strong transactional guarantees; JSONB support covers semi-structured needs (skill tags, dynamic eligibility criteria) without needing a second database |
| Document/log store | MongoDB (optional, P1) | Only if audit logs / unstructured resume data volume grows large enough to warrant separation from OLTP store |
| Caching | **Redis** | Session/token caching, rate limiting counters, hot-path caching (job listings, dashboard aggregates) |
| Search | Postgres full-text (launch) → OpenSearch/Elasticsearch (P2) | Avoid premature complexity; upgrade when job/company search volume justifies it |
| Object storage | **AWS S3 / Azure Blob** | Resumes, offer letters, uploaded documents |
| Deployment | **AWS (ECS/Fargate or EKS) or Azure equivalent** | Managed container orchestration, avoids self-managed K8s control plane at launch |
| Message queue | **Redis (BullMQ) at launch → SQS/RabbitMQ at scale** | Async jobs: notifications, resume parsing, report generation |

### 1.3 API Gateway Pattern

A single **API Gateway** (e.g., AWS API Gateway, or NestJS-level gateway module) fronts all client traffic:
- Centralized authentication/token validation
- Request routing to internal modules
- Rate limiting and request throttling per role/tenant
- Request/response logging for audit
- API versioning (`/api/v1/...`)

### 1.4 Load Balancing Strategy

- **Application Load Balancer (ALB)** distributing across containerized app instances (min 2 for HA at launch)
- Health-check based instance replacement
- Sticky sessions **avoided** — auth is stateless (JWT), so any instance can serve any request
- Read-replica routing for PostgreSQL for analytics/reporting queries to isolate load from OLTP writes (P1)

### Implementation Priority — Architecture

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Modular monolith scaffold (NestJS) | P0 | 8 | None |
| PostgreSQL schema + migrations setup | P0 | 5 | None |
| Redis caching layer | P0 | 3 | Infra provisioning |
| API Gateway + versioning | P0 | 5 | Scaffold |
| S3/Blob storage integration | P0 | 3 | Infra provisioning |
| Read-replica routing for analytics | P1 | 5 | Postgres setup |
| Search upgrade (OpenSearch) | P2 | 8 | Postgres FTS baseline |

---

## 2. Authentication & Authorization Module

### 2.1 JWT Implementation

- **Access token:** short-lived (15 min), signed (RS256), contains `sub`, `role`, `permissions[]`, `tenantId` (if multi-college), `exp`
- **Refresh token:** long-lived (7–30 days, configurable via "Remember Me"), stored as httpOnly, secure, SameSite=strict cookie; rotated on every use (refresh token rotation to detect reuse/theft)
- Refresh endpoint: `POST /api/v1/auth/refresh` — validates refresh token, issues new access + refresh pair, invalidates old refresh token
- Token revocation list maintained in Redis for logout/forced session termination

### 2.2 RBAC — Permission Matrix

| Resource / Action | Student | Placement Officer | Super Admin |
|---|---|---|---|
| View own profile | ✅ | ✅ (any student, read-only) | ✅ (any) |
| Edit own profile | ✅ | ❌ | ✅ (override) |
| Apply to job | ✅ | ❌ | ❌ |
| Create/edit job posting | ❌ | ✅ | ✅ |
| Shortlist/reject candidates | ❌ | ✅ | ✅ |
| Manage company profiles | ❌ | ✅ | ✅ |
| View placement analytics (own drives) | ❌ | ✅ | ✅ |
| View global cross-department analytics | ❌ | ❌ | ✅ |
| Manage user accounts/roles | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| Manage placement seasons | ❌ | ❌ | ✅ |
| Configure integrations | ❌ | ❌ | ✅ |

Permissions are implemented as granular strings (e.g., `job:create`, `student:read:any`) grouped into roles, not hardcoded role checks — enabling future custom roles (P1) without code changes.

### 2.3 OAuth 2.0 / SAML Integration Roadmap

- **P1:** OAuth 2.0 / OIDC support for institutional Google Workspace / Microsoft 365 login
- **P2:** SAML 2.0 SSO for institutions with enterprise IdP (Okta, ADFS, Shibboleth) — common in university environments
- Adapter pattern: an `IdentityProvider` interface abstracts local-auth, OIDC, and SAML so the rest of the system is provider-agnostic

### 2.4 Password Security

- Hashing: **Argon2id** (preferred) or bcrypt (cost factor 12) as fallback
- Password policy enforced server-side: min 10 chars, complexity rules configurable by Admin
- Breach-check against known-compromised password lists (e.g., HaveIBeenPwned k-anonymity API) at signup/reset — P1

### 2.5 Rate Limiting / Brute Force Protection

- Login endpoint: sliding-window rate limit (e.g., 5 attempts / 15 min per IP+account combo) via Redis
- Exponential backoff + account lock with admin-notified unlock after threshold
- CAPTCHA challenge triggered after N failed attempts (P1)

### Implementation Priority — Auth Module

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| JWT issuance + refresh rotation | P0 | 8 | Architecture scaffold |
| RBAC permission engine | P0 | 8 | JWT module |
| Password hashing + policy | P0 | 3 | — |
| Rate limiting on auth endpoints | P0 | 3 | Redis |
| OAuth/OIDC (Google/MS) | P1 | 8 | Identity provider adapter |
| SAML SSO | P2 | 13 | OIDC groundwork |
| Breach-check on passwords | P1 | 2 | External API |

---

## 3. Student Module APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/students/register` | POST | Registration with enrollment number verification against academic records |
| `/api/v1/students/{id}/profile` | GET/PUT | Profile CRUD |
| `/api/v1/students/{id}/resume` | POST | Resume upload → triggers async resume-parser job |
| `/api/v1/students/{id}/skills` | GET/POST/DELETE | Skill tagging (self-declared + assessed) |
| `/api/v1/jobs` | GET | List jobs, filterable by eligibility auto-match |
| `/api/v1/jobs/{id}/apply` | POST | Submit application (validates eligibility server-side, not just UI) |
| `/api/v1/applications/{id}` | GET | Application detail + status |
| `/api/v1/applications/{id}/status` | GET | Status history (Applied → Shortlisted → Interview → Offer/Rejected) |
| `/api/v1/students/{id}/placement-status` | GET | Aggregated placement status (placed/unplaced, offer details) |

**Application workflow state machine:**
`APPLIED → UNDER_REVIEW → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEWED → OFFER_EXTENDED → OFFER_ACCEPTED/OFFER_DECLINED/REJECTED`

Each transition is logged (actor, timestamp, reason where applicable) for audit and analytics.

### Implementation Priority — Student APIs

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Registration + enrollment verification | P0 | 5 | LMS integration (or manual verify fallback) |
| Profile CRUD | P0 | 5 | Auth |
| Resume upload + parser trigger | P0 | 5 | S3, Resume parser integration |
| Job listing + eligibility filter | P0 | 8 | Eligibility engine |
| Application submission + state machine | P0 | 8 | Job module |
| Skill tagging | P1 | 5 | Profile module |
| Placement status aggregation | P1 | 3 | Application module |

---

## 4. Placement Officer Module APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/companies` | GET/POST/PUT | Company profile management |
| `/api/v1/companies/{id}/contacts` | GET/POST | Contact/relationship history |
| `/api/v1/jobs` | POST | Create job posting with eligibility criteria payload |
| `/api/v1/jobs/{id}/eligibility` | PUT | Define/update eligibility rules (CGPA, branch, backlog, batch) |
| `/api/v1/jobs/{id}/candidates` | GET | Candidate matching — returns ranked/filtered eligible pool |
| `/api/v1/applications/{id}/shortlist` | POST | Move candidate to shortlisted state (supports bulk via array payload) |
| `/api/v1/interviews` | POST | Create interview slots |
| `/api/v1/interviews/{id}/allocate` | POST | Allocate candidate to slot, conflict-checked against student's other interviews |
| `/api/v1/offers` | POST | Extend offer |
| `/api/v1/offers/{id}/decision` | PUT | Record student acceptance/rejection (mirrored from student action) |
| `/api/v1/notifications/bulk` | POST | Bulk communication to segmented audience |

**Candidate matching algorithm (P1, initial version rule-based, P2 weighted scoring):**
- V1: hard-filter by eligibility criteria (CGPA ≥ X, branch ∈ [...], no active backlogs) — deterministic, explainable
- V2 (P2): weighted scoring incorporating skill-match %, past assessment scores, historical offer-acceptance likelihood, surfaced as a ranked list rather than replacing the officer's judgment

### Implementation Priority — Placement Officer APIs

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Company profile CRUD | P0 | 5 | Auth |
| Job posting + eligibility criteria engine (rule-based) | P0 | 13 | Student module |
| Candidate matching (V1 hard-filter) | P0 | 8 | Eligibility engine |
| Bulk shortlist/reject | P0 | 5 | Application state machine |
| Interview slot creation + allocation + conflict check | P1 | 8 | Application module |
| Offer creation + decision sync | P0 | 5 | Application module |
| Bulk communication API | P1 | 8 | Notification engine |
| Candidate matching V2 (weighted scoring) | P2 | 13 | Analytics data, V1 baseline |

---

## 5. Super Admin Module APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/admin/users` | GET/POST/PUT/DELETE | User provisioning, role assignment, deactivation |
| `/api/v1/admin/roles` | GET/POST/PUT | Role/permission configuration |
| `/api/v1/admin/seasons` | GET/POST/PUT | Placement season lifecycle (create/activate/freeze/archive) |
| `/api/v1/admin/announcements` | POST | System-wide broadcast |
| `/api/v1/admin/export` | POST | Trigger async data export (CSV/Excel/PDF), returns job ID + download link on completion |
| `/api/v1/admin/audit-logs` | GET | Filterable, paginated audit trail |
| `/api/v1/admin/backup` | POST | Trigger on-demand backup |
| `/api/v1/admin/system-health` | GET | Aggregated health/status for ops dashboard |

**Data export** is handled asynchronously via the message queue (large exports can take minutes); the client polls or receives a notification/webhook on completion, with the file available via a time-limited signed S3 URL.

### Implementation Priority — Super Admin APIs

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| User provisioning/deactivation | P0 | 5 | RBAC |
| Role/permission configuration UI-backing API | P1 | 5 | RBAC engine |
| Season lifecycle management | P0 | 8 | Core data model design |
| System-wide announcements | P1 | 3 | Notification engine |
| Async data export (CSV/XLSX/PDF) | P1 | 8 | Queue, storage |
| Audit log query API | P0 | 5 | Audit logging service |
| Backup/DR trigger | P2 | 5 | Infra (managed DB backups) |

---

## 6. Notification Engine

### 6.1 Architecture

- Central `NotificationService` publishes events to a queue (BullMQ/SQS); dedicated workers consume and dispatch per channel.
- **Email:** SendGrid or AWS SES, with template management (versioned HTML templates, merge-tag support: `{{studentName}}`, `{{companyName}}`, etc.)
- **SMS:** gateway placeholder (Twilio / MSG91 for India-based institutions) — abstracted behind a `SmsProvider` interface for easy swap
- **In-app notification center:** persisted notification records per user, read/unread state, read receipts, real-time delivery via WebSocket (Socket.IO) or polling fallback
- **Push notifications:** architecture placeholder using FCM (Firebase Cloud Messaging) for future mobile app — device token registration endpoint reserved now even if push isn't built at launch

### 6.2 Template Management

- Templates stored in DB (not hardcoded), versioned, with a preview/test-send capability for admins
- Category tagging (transactional vs. bulk/marketing) to keep deliverability of critical transactional mail (OTP, offer letters) unaffected by bulk sends

### Implementation Priority — Notification Engine

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Email integration (SES/SendGrid) + core transactional templates | P0 | 8 | Queue infra |
| In-app notification center (persisted + read state) | P0 | 5 | WebSocket/polling |
| Bulk send with audience segmentation | P1 | 8 | Notification service |
| SMS gateway integration | P1 | 5 | SMS provider account |
| Template management UI-backing API | P1 | 5 | Notification service |
| Push notification infra (FCM) | P2 | 8 | Mobile app (future) |

---

## 7. Reporting & Analytics APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/analytics/dashboard/{role}` | GET | Real-time aggregated metrics per role dashboard |
| `/api/v1/analytics/placements` | GET | Placement statistics (%, avg CTC, dept-wise) filterable by season |
| `/api/v1/analytics/predictions/{studentId}` | GET | Predictive placement-probability score (P2) |
| `/api/v1/reports/schedule` | POST | Configure scheduled report (recipients, cadence, format) |
| `/api/v1/reports/{id}/download` | GET | Retrieve generated report file |

- **Real-time aggregation (launch):** materialized views / scheduled aggregation jobs (every few minutes) rather than live joins on every dashboard load, to protect OLTP performance.
- **Predictive analytics (P2):** a simple logistic-regression or gradient-boosted model trained on historical placement outcomes (CGPA, skills, past interview performance) — framed to officers as a *supporting signal*, not a decision-maker, with model explainability notes to avoid opaque high-stakes scoring of students.
- **Data warehouse strategy (P2):** as historical volume grows across seasons, ETL aggregated/anonymized data into a warehouse (e.g., Redshift/BigQuery/Snowflake) to keep heavy analytical queries off the OLTP database entirely.

### Implementation Priority — Reporting & Analytics

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Dashboard aggregation (materialized views) | P0 | 8 | Core data models |
| Placement statistics API | P0 | 5 | Application/Offer data |
| Scheduled report generation | P1 | 8 | Export service, queue |
| Predictive placement-probability model | P2 | 13 | Historical data volume |
| Data warehouse ETL pipeline | P2 | 13 | Multi-season data |

---

## 8. Integration Points

| Integration | Purpose | Notes |
|---|---|---|
| **Resume parsing** (Affinda / Rossum) | Extract structured data (education, skills, experience) from uploaded resumes to pre-fill profile | Async job on upload; fallback to manual entry if parse confidence is low |
| **Video interview platforms** (Zoom / MS Teams API) | Auto-generate meeting links when interview slots are scheduled, embed join link in calendar invite/notification | OAuth app registration required per institution tenant |
| **LMS integration** | Verify academic records (CGPA, attendance, backlog status) feeding the eligibility engine | Read-only integration; institution's LMS is source of truth for academic data |
| **HRMS export formats** | Provide placement data to hiring companies in their required format | Configurable export templates (CSV/XLSX field mapping) per company, P2 |

All integrations are built behind adapter interfaces so a specific vendor (e.g., swapping Affinda for another parser) can be replaced without touching core business logic.

### Implementation Priority — Integrations

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Resume parser adapter + integration | P0 | 8 | Storage, async queue |
| LMS read-only integration for academic verification | P1 | 8 | Institution LMS API access |
| Video interview API hooks | P1 | 8 | Interview scheduling module |
| HRMS custom export templates | P2 | 8 | Export service |

---

## 9. Security Framework

- **Input validation:** schema-based validation at API boundary (e.g., `class-validator`/Zod DTOs) for every endpoint; reject unknown fields (allow-list, not deny-list)
- **SQL injection prevention:** parameterized queries / ORM (TypeORM/Prisma) exclusively — no raw string concatenation in queries
- **XSS protection:** output encoding on any user-generated content rendered in UI; strict Content-Security-Policy headers; sanitize rich-text fields (e.g., announcement bodies) server-side
- **CSRF tokens:** required for cookie-authenticated state-changing requests (double-submit cookie pattern), not needed for pure Bearer-token API calls but enforced wherever cookies carry auth
- **Encryption at rest:** database-level encryption (managed by cloud provider, e.g., RDS encryption), S3 server-side encryption for documents
- **Encryption in transit:** TLS 1.2+ enforced everywhere, HSTS enabled
- **Audit logging:** every sensitive operation (login, role change, data export, offer decision, admin action) written to an append-only audit log table with actor/action/entity/timestamp/IP, independent of business tables
- **GDPR / data-privacy compliance:** data minimization by default, explicit consent capture for data sharing with recruiting companies, right-to-erasure workflow (soft-delete + scheduled hard-delete after retention window), data processing agreement placeholders for third-party integrations

### Implementation Priority — Security

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Input validation DTOs across all endpoints | P0 | 8 | API scaffold |
| ORM-enforced query layer | P0 | 3 | DB setup |
| CSP headers + XSS sanitization | P0 | 5 | Frontend coordination |
| CSRF protection (cookie flows) | P0 | 3 | Auth module |
| Encryption at rest/in transit config | P0 | 3 | Infra provisioning |
| Audit logging service | P0 | 8 | Core data model |
| GDPR consent + erasure workflow | P1 | 8 | User/data model |

---

## 10. Database Schema (Entity Overview)

### 10.1 Core Entities (ERD as tables)

**`users`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | varchar, unique | |
| password_hash | varchar | nullable if SSO-only |
| role_id | FK → roles | |
| status | enum(active, suspended, deactivated) | |
| mfa_enabled | boolean | |
| created_at / updated_at | timestamp | |
| deleted_at | timestamp, nullable | soft delete |

**`roles` / `permissions` / `role_permissions`** — standard RBAC join tables

**`student_profiles`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | FK → users | |
| enrollment_no | varchar, unique | |
| branch, batch_year | varchar/int | |
| cgpa | decimal | synced from LMS |
| backlog_count | int | synced from LMS |
| resume_url | varchar | S3 key |
| profile_completion_pct | int | computed |

**`companies`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name, sector, website | varchar | |
| relationship_owner_id | FK → users (Placement Officer) | |

**`jobs`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| company_id | FK → companies | |
| title, description, ctc_min, ctc_max | mixed | |
| eligibility_criteria | JSONB | flexible rule schema |
| season_id | FK → seasons | |
| status | enum(draft, published, closed) | |

**`applications`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| student_id | FK → student_profiles | |
| job_id | FK → jobs | |
| status | enum (state machine, §3) | |
| status_history | JSONB / separate `application_status_log` table | |

**`interviews`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| job_id | FK → jobs | |
| round_number | int | |
| scheduled_at | timestamp | |
| mode | enum(online, in-person) | |
| meeting_link | varchar, nullable | |

**`offers`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| application_id | FK → applications | |
| ctc | decimal | |
| decision | enum(pending, accepted, declined) | |
| decision_deadline | timestamp | |

**`seasons`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name (e.g., "2026-27") | varchar | |
| status | enum(upcoming, active, frozen, archived) | |

**`audit_logs`** (append-only)

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| actor_id | FK → users | |
| action | varchar | |
| entity_type, entity_id | varchar/UUID | |
| ip_address | varchar | |
| created_at | timestamp | |

### 10.2 Indexing Strategy

- B-tree indexes on all foreign keys and frequently filtered columns (`applications.status`, `jobs.season_id`, `users.email`)
- Composite index on `(student_id, job_id)` unique constraint to prevent duplicate applications
- GIN index on `jobs.eligibility_criteria` (JSONB) for eligibility query performance
- Partial index on `users` where `deleted_at IS NULL` for hot-path queries excluding soft-deleted rows

### 10.3 Migration Versioning

- Migration tool: **TypeORM migrations / Prisma Migrate** — every schema change is a versioned, reversible migration file checked into source control
- No manual production schema edits; migrations run through CI/CD pipeline with a dry-run/plan step against staging first

### 10.4 Soft Delete Pattern

- `deleted_at` timestamp column on user-facing entities (`users`, `jobs`, `companies`) rather than hard delete, preserving referential integrity for historical applications/offers
- Scheduled hard-delete job purges soft-deleted records past the configured retention window (compliance-driven)

### Implementation Priority — Database

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| Core schema (users, students, jobs, applications) | P0 | 8 | None |
| Offers, interviews, seasons schema | P0 | 5 | Core schema |
| Audit log table + write hooks | P0 | 5 | Core schema |
| Indexing pass | P0 | 3 | Core schema |
| Soft-delete + retention purge job | P1 | 5 | Core schema |

---

## 11. API Documentation Standards

- **Spec format:** OpenAPI 3.0, generated from code annotations (NestJS Swagger module / FastAPI auto-docs) to avoid spec drift
- **Endpoint naming:** RESTful, plural nouns, versioned prefix — `/api/v1/{resource}/{id}/{sub-resource}`
- **Error response standard:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [{ "field": "email", "issue": "must be a valid email" }],
    "traceId": "uuid-for-support-correlation"
  }
}
```
- **Pagination:** cursor-based for high-volume lists (`?cursor=...&limit=...`), offset-based acceptable for smaller admin tables; response includes `nextCursor`, `hasMore`, `totalCount` (where feasible)
- **Filtering:** query-param convention `?filter[field]=value`, documented per-endpoint in OpenAPI

### Implementation Priority — API Docs

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| OpenAPI auto-generation setup | P0 | 3 | API scaffold |
| Standardized error envelope | P0 | 2 | API scaffold |
| Pagination/filtering conventions applied across endpoints | P0 | 5 | Core endpoints built |

---

## 12. Deployment & DevOps

### 12.1 CI/CD Pipeline Stages

1. Lint + unit tests (on every PR)
2. Build + integration tests (against ephemeral test DB)
3. Security scan (dependency audit, SAST)
4. Deploy to **staging** (auto, on merge to `develop`)
5. Manual QA / UAT sign-off gate
6. Deploy to **production** (auto, on merge to `main`, with rollback plan)

### 12.2 Environment Configuration

| Environment | Purpose | Data |
|---|---|---|
| `dev` | Local/shared development | Synthetic/seeded data |
| `staging` | Pre-prod validation, client UAT | Anonymized production-like data |
| `prod` | Live system | Real data, full security controls |

Config managed via environment variables + secrets manager (AWS Secrets Manager / Azure Key Vault) — never committed to source control.

### 12.3 Containerization & Orchestration

- **Docker** images for the app, built via multi-stage builds (small final image)
- **Kubernetes (EKS/AKS)** for orchestration once scale justifies it; at launch, **ECS Fargate** (or Azure Container Apps) is recommended for lower operational overhead — revisit K8s when the team needs finer-grained scaling/service-mesh control
- Horizontal pod/task autoscaling based on CPU/memory + request queue depth

### 12.4 Monitoring & Observability

- **Metrics:** Prometheus + Grafana dashboards (request latency, error rate, queue depth, DB connection pool utilization)
- **Log aggregation:** centralized structured JSON logs shipped to a log store (e.g., CloudWatch Logs, ELK/OpenSearch, or Loki) with correlation IDs tying logs to `traceId` from the error envelope
- **Alerting:** threshold-based alerts (error rate spike, latency SLO breach, failed job queue backlog) routed to on-call channel (PagerDuty/Slack)
- **Uptime SLO target:** 99.5% at launch, revisited as usage grows

### Implementation Priority — DevOps

| Item | Priority | Story Points | Dependencies |
|---|---|---|---|
| CI pipeline (lint/test/build) | P0 | 5 | Repo setup |
| CD to staging + prod | P0 | 5 | CI pipeline |
| Dockerization | P0 | 3 | App scaffold |
| ECS/Fargate deployment | P0 | 8 | Docker images |
| Prometheus/Grafana monitoring | P1 | 8 | Deployed infra |
| Centralized log aggregation | P1 | 5 | Deployed infra |
| Kubernetes migration | P2 | 13 | Scale justification |

---

## 13. Cross-Reference: Backend ↔ UI Dependency Summary

See the companion **UI/UX Design Strategy document** (`01-UIUX-Design-Strategy.md`) §8 for the inverse mapping.

| Backend Service | Enables UI Component(s) |
|---|---|
| Auth & RBAC Module | Login, role-based nav/dashboards, session management |
| Eligibility Criteria Engine | Job listings filter, drive creation wizard, candidate matching |
| Application Workflow API | Application tracking timeline, shortlisting interface |
| Interview Slot Allocation API | Interview calendar, scheduling board |
| Offer Management API | Offer letter management |
| Company Profile API | CRM table |
| Notification Engine | Communication center, toast/in-app notifications |
| Reporting & Analytics API | All analytics dashboards |
| Audit Logging Service | Audit logs viewer |
| Integration Adapter Layer | Integration settings panel |

---

*End of Phase 2 document. See `01-UIUX-Design-Strategy.md` for the corresponding design specification.*
