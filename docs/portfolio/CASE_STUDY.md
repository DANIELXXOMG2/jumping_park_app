# Case Study: Jumping Park — Digital Consent Platform

> **Live**: [jumpingpark.lat](https://www.jumpingpark.lat)
> **Repo**: [github.com/danielxxomg/jumping_park_app](https://github.com/danielxxomg/jumping_park_app)
> **Author**: Daniel Bello

---

## The Problem

Jumping Park, a trampoline park in Villavicencio, Colombia, used paper-based consent forms for every visitor. This created three operational pain points:

1. **Slow intake**: Parents waited in line to fill forms by hand before kids could jump.
2. **No searchability**: Finding a specific consent record meant digging through paper archives.
3. **Legal risk**: Paper signatures were hard to verify, easy to lose, and impossible to audit at scale.

The park needed a digital system that would work **on-site at a kiosk**, handle **OTP verification**, capture **legally binding digital signatures**, and give operators a **searchable admin dashboard** — all while staying within Firebase's free tier.

---

## The Approach

I designed and built Jumping Park as a **kiosk-first, offline-safe consent platform** using:

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 App Router, React 19, Tailwind v4 | Server Components for SEO, RSC for minimal client JS |
| Backend | Firebase Admin SDK, Firestore, Storage | Free-tier friendly, real-time capable, no server to manage |
| Auth | Custom Claims RBAC + OTP via Resend | Role-based admin access, email-based visitor verification |
| Validation | Zod 4 schemas shared client/server | Type-safe contracts, single source of truth |
| State | Zustand (kiosk) + SWR (admin) | Local-first kiosk UX, deduped admin data fetching |
| Quality | Biome, custom audit harness, Lighthouse CI, Playwright | Single linter, repo-specific quality gates, automated a11y |

The architecture follows a **service-layer pattern**: thin route handlers own HTTP concerns (auth, validation, response codes) while service files own business logic, Firestore access, and response shaping.

---

## Key Technical Decisions

### 1. Kiosk-first, not admin-first
The kiosk is the primary surface. Every design decision optimizes for a **touchscreen in a noisy park**: large tap targets, minimal typing, offline resilience, and instant feedback.

### 2. OTP over passwords
Visitors authenticate with a **6-digit email OTP** — no accounts, no passwords, no app downloads. The OTP lifecycle includes rate-limiting, lockout after 5 failed attempts, and split session/legacy fallback for backward compatibility.

### 3. Offline-safe consent replay
When the kiosk loses connectivity, consents queue locally in IndexedDB. On reconnect, the server replays them through an **idempotency ledger** (`offline_sync`) using SHA-256 dedupe keys. No duplicate consents, no lost signatures.

### 4. Cursor-first admin queries
Admin lists use **opaque Firestore cursors** instead of offset pagination. This keeps read costs bounded to 20-50 documents per page regardless of dataset size — critical for staying within free tier.

### 5. Aggregate read models
The admin dashboard reads from `admin_metrics/overview` and `admin_metrics/daily:yyyy-mm-dd` documents instead of recomputing scans. Freshness metadata tells operators whether they're seeing live or cached data.

### 6. Public SEO + AI-SEO surface
The `/consentimiento-digital` page is the canonical public-facing surface with:
- AmusementPark JSON-LD with GeoCoordinates, AggregateRating, and openingHoursSpecification
- HowTo schema for the 3-step registration process
- `robots.txt` with AI bot rules (ChatGPT-User, anthropic-ai, Bingbot)
- `llms.txt` with structured business context for LLMs
- `pricing.md` with machine-readable pricing

---

## Production Metrics

### Lighthouse (CI enforced)

| Metric | Threshold | Status |
|--------|-----------|--------|
| Performance | ≥ 80 | ✅ Pass |
| Accessibility | ≥ 90 | ✅ Pass (after viewport fix) |
| Best Practices | ≥ 90 | ✅ Pass |
| SEO | ≥ 90 | ✅ Pass |
| LCP | ≤ 3600ms | ✅ Pass |
| CLS | ≤ 0.1 | ✅ Pass |

### PageSpeed Insights (production)

| Page | Performance | SEO | LCP | CLS |
|------|------------|-----|-----|-----|
| `/consentimiento-digital` | 98 | 100 | 2362ms | 0 |
| `/` (homepage) | 83 | 66 | 4323ms | 0.083 |

### Test Coverage

| Layer | Count | Tool |
|-------|-------|------|
| Unit/Integration | 511 | Bun test |
| E2E (a11y) | 5+ | Playwright + Axe |
| Audit checks | 6/6 | Custom harness |

### Quality Gates

| Gate | Status |
|------|--------|
| Biome lint | ✅ Pass |
| TypeScript strict | ✅ Pass |
| Documentation truth | ✅ Pass |
| Dead code (knip) | Advisory — 3 exports |
| Duplication (jscpd) | Advisory — 1.76% |
| Circular deps | ✅ Pass |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge / CDN                         │
│               (only main branch deploys)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Next.js 16      │
                    │   App Router      │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────┴───────┐   ┌────────┴────────┐   ┌────────┴────────┐
│  (kiosk)      │   │  (admin)        │   │  (public)       │
│  Visitor flow │   │  Back-office    │   │  SEO/AI surface │
│  OTP + sign   │   │  Dashboard      │   │  Landing +      │
│  Offline queue│   │  Consents       │   │  Consentimiento │
│               │   │  Users/Minors   │   │  JSON-LD        │
└───────┬───────┘   └────────┬────────┘   └────────┬────────┘
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Firebase       │
                    │  Admin SDK      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────┴──────┐ ┌────┴────┐ ┌───────┴──────┐
       │  Firestore  │ │ Storage │ │  Auth        │
       │  consents   │ │ Sign-   │ │  Custom      │
       │  users      │ │ atures  │ │  Claims      │
       │  OTP        │ │ PDFs    │ │  RBAC        │
       │  offline_   │ │         │ │              │
       │  sync       │ │         │ │              │
       └─────────────┘ └─────────┘ └──────────────┘
```

### Data Flow

```text
Kiosk → OTP challenge → email code → validate → create session
      → fill form → sign canvas → upload signature
      → create consent (atomic counter + denormalized snapshots)
      → send confirmation email

Offline path:
Kiosk → queue in IndexedDB → reconnect → replay via API
      → server checks offline_sync ledger → dedupe → create consent

Admin path:
Admin UI → /api/admin/* → auth + permissions → service layer
        → cursor queries → Firestore → paginated response
        → aggregate reads (admin_metrics) → dashboard
```

---

## What I Learned

### 1. Offline is not a feature — it's a contract
The offline replay system taught me that idempotency is not just about "don't duplicate." It's about **proving** you didn't duplicate. The `offline_sync` ledger with SHA-256 dedupe keys creates an auditable trail that survives process restarts and server failures.

### 2. Free-tier architecture forces better design
Staying within Firebase's free tier meant every query had to be bounded, every index had to be justified, and every aggregate had to be precomputed. These constraints produced a cleaner data model than I would have built with unlimited budget.

### 3. Kiosk UX is not web UX
Designing for a touchscreen in a noisy park changes everything: font sizes, tap targets, error recovery, and offline behavior all need different tradeoffs than a typical web app. The kiosk layout is intentionally minimal and isolated from the public/admin surfaces.

### 4. SEO for AI is real
Adding `llms.txt`, `pricing.md`, and structured JSON-LD wasn't just SEO theater. It made the site discoverable by AI assistants and positioned it for the next generation of search.

### 5. Quality gates need to be repo-specific
A generic `bun run check` is not enough. I built a custom audit harness (`scripts/audit.ts`) with hard-fail and advisory categories that understand this repo's specific risks — not just generic lint rules.

---

## Portfolio Artifacts

| Artifact | Location | Status |
|----------|----------|--------|
| Screenshots (7 real captures) | `docs/portfolio/screenshots/` | ✅ Ready |
| HyperFrames composition (7 scenes) | `docs/portfolio/motion/composition/` | ✅ Ready |
| Product tour video (78s, Spanish TTS) | `docs/portfolio/renders/jumping-park-product-tour.mp4` | ✅ Ready |
| Architecture diagrams (3 Mermaid) | `diagramas/` | ✅ Ready |
| External validation evidence | `docs/portfolio/evidence/` | ✅ Automated scripts |
| ADRs (5 decisions) | `docs/adr/` | ✅ Documented |
| Runbooks (7 operational guides) | `docs/runbooks/` | ✅ Current |

---

## Technical Specs

| Spec | Value |
|------|-------|
| Framework | Next.js 16.2.6 (Turbopack) |
| React | 19.2.1 |
| Runtime | Bun |
| Database | Firestore (free tier) |
| Storage | Firebase Storage |
| Auth | Firebase Auth + Custom Claims |
| Email | Resend |
| Styling | Tailwind CSS v4.3.0 |
| State | Zustand 5 + SWR 2 |
| Validation | Zod 4 |
| Linter | Biome 2.4.10 |
| Testing | Bun test + Playwright |
| Deployment | Vercel (main only) |
| Domain | jumpingpark.lat |

---

## What's Next

- **Homepage LCP optimization**: currently 4323ms, target <2500ms
- **Full WCAG 2.1 AA manual audit**: automated checks pass, manual review pending
- **Business logic audit**: deep review of `src/` services and scripts
- **AI visibility monitoring**: track citations in ChatGPT, Perplexity, Gemini
- **Google Search Console**: monitor structured data appearance and indexing

---

*Built with SDD (Spec-Driven Development). All artifacts are traceable to Engram-backed proposals, specs, designs, and verification reports.*
