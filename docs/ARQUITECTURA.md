# Arquitectura del sistema

Este documento refleja la arquitectura vigente despues del hardening incremental del cambio `comprehensive-product-audit-and-roadmap`. El foco actual no es reescribir el producto, sino operar mejor: menos costo, mas accesibilidad, mejor resiliencia y una superficie publica documentada para SEO y AI-SEO.

Mapa documental actual: `docs/README.md`.

## 1. Resumen ejecutivo

- Stack: Next.js 16 App Router, React 19, Bun, Firebase Admin, Firestore, Storage, Resend, Zod, Zustand y SWR.
- Patrón dominante: App Router + service layer + wrappers de validacion/autorizacion.
- Principio de rollout: todo es aditivo y controlado por flags; no hay migraciones destructivas.
- Objetivo operativo: mantener el producto dentro de presupuestos de free tier sin degradar UX ni accesibilidad.

## 2. Planos del sistema

### 2.1 Kiosk plane

- `src/app/(kiosk)` concentra el flujo presencial: ingreso, OTP, registro, consentimiento y exito.
- `src/store/kioskStore.ts` persiste estado clave del visitante para continuidad local.
- `src/lib/offline/*` implementa el staged rollout offline:
  - Stage 1: shell/assets/session cache.
  - Stage 2: cola local de consentimientos.
  - Stage 3: replay idempotente contra `offline_sync`.

### 2.2 Admin data plane

- `src/app/api/admin/*` delega negocio a servicios y aplica auth/permissions.
- `src/services/userService.ts`, `src/services/minorIndexService.ts` y `src/app/api/admin/consents/route.ts` exponen contratos cursor-first para listas administrativas.
- La paginacion usa cursores opacos (`src/lib/adminCursor.ts`, `src/lib/firestoreService.ts`) para evitar costos por `offset` sobre Firestore.
- Los endpoints siguen permitiendo fallback legacy cuando `CURSOR_PAGINATION_ENABLED=false`.

### 2.3 Aggregate plane

- `src/services/adminMetricsService.ts` mantiene el modelo `admin_metrics/*`.
- Documentos principales:
  - `admin_metrics/overview`
  - `admin_metrics/daily:yyyy-mm-dd`
- El dashboard y los stats detallados pueden leer 1-5 documentos agregados en lugar de recomputar scans completos cuando `ADMIN_AGGREGATES_ENABLED=true`.
- Cada respuesta expone `freshness` para mostrar si el dato viene del plano agregado o del fallback live.

### 2.4 Public discovery plane

- `src/app/(public)/consentimiento-digital/page.tsx` es la URL canonica publica.
- `src/app/robots.ts`, `src/app/sitemap.ts` y `src/app/llms.txt/route.ts` controlan indexabilidad tradicional y contexto para agentes.
- `src/lib/seo.ts` centraliza rutas publicas, robots, canonical URLs y JSON-LD.

### 2.5 Perimeter and security plane

- `src/proxy.ts` aplica headers de seguridad y control de indexacion para superficies privadas.
- El perimeter mantiene un baseline CSP enforced y usa `CSP_REPORT_ONLY_ENABLED` solo para el canary/report-only mas estricto.
- El perimeter tambien sostiene `X-Robots-Tag: noindex, nofollow` para rutas privadas del kiosk/admin.

## 3. Flujo de datos

```mermaid
flowchart LR
    Kiosk[Kiosk UI] --> OTP[otp_challenges / otp_access_sessions]
    Kiosk --> Queue[offline queue local]
    Queue -->|online replay| ConsentAPI[/api/consentimientos]
    ConsentAPI --> ConsentSvc[consentService]
    ConsentSvc --> Firestore[(consents + users + minors_index)]
    ConsentSvc --> Ledger[(offline_sync)]

    AdminUI[Admin UI] --> AdminAPI[/api/admin/*]
    AdminAPI --> Cursor[Cursor queries]
    AdminAPI --> Metrics[(admin_metrics)]
    AdminAPI --> Audit[(admin_audit_logs)]

    Public[Public route] --> SEO[robots + sitemap + llms.txt + JSON-LD]
    Edge[src/proxy.ts] --> Public
    Edge --> AdminUI
    Edge --> Kiosk
```

## 4. Colecciones y contratos operativos

| Recurso | Uso actual | Contrato clave |
| --- | --- | --- |
| `otp_challenges` | Challenge OTP pendiente | throttle, lockout y expiracion |
| `otp_access_sessions` | Sesion validada del kiosk | vigencia corta y recovery local |
| `consents` | Consentimientos firmados | snapshots denormalizados, consecutivo atomico |
| `minors_index` | Busqueda eficiente de menores | proyeccion denormalizada |
| `admin_metrics` | Read model administrativo | overview + diarios + freshness |
| `offline_sync` | Ledger de idempotencia | mismo `dedupeKey` => mismo ack |
| `admin_audit_logs` | Traza inmutable admin | actor, accion, timestamp |

## 5. Cursor data plane

El costo mas peligroso en Firestore no era escribir: era saltar documentos. Por eso el admin migra a cursores opacos.

- `CursorPageRequest`: `limit`, `cursor`, `search`.
- `CursorPageResponse`: `items`, `pageInfo`, `meta`.
- `pageInfo.nextCursor` es opaco, versionado y ligado a coleccion/campo/orden.
- `meta.source` diferencia lectura cursor vs busqueda.
- Las listas administrativas nunca devuelven signed URLs en listados; solo `signatureStatus`.

Impacto:

- lecturas acotadas a 20-50 registros por pagina;
- latencia mas estable;
- rollback inmediato via flag si aparece drift operativo.

## 6. Aggregates y recompute

El dashboard no deberia pagar scans completos cada vez que alguien abre el admin.

- `adminMetricsService.getOverview()` lee/agenera `admin_metrics/overview`.
- `adminMetricsService.getDetailed()` arma KPIs con overview + documentos diarios.
- `freshness.computedAt` permite validar si el agregado esta dentro de la ventana esperada.
- Si falta un agregado o queda stale, existe recompute controlado; el fallback live sigue disponible detras del flag.

Runbook operativo: `docs/runbooks/admin-cost-smoke-checklist.md`.

## 7. Offline resilience

La estrategia offline es deliberadamente escalonada.

### Stage 1

- cache de shell, assets y sesion reciente del kiosk;
- navegacion sobre pantallas visitadas sin caidas abruptas.

### Stage 2

- cola local de `consent.create`;
- feedback al operador aunque no haya red;
- retry automatico al volver `online` y al iniciar la app.

### Stage 3

- `dedupeKey = sha256(userId + policyVersion + signedAtLocal)`;
- `offline_sync/{dedupeKey}` evita duplicados y drift del consecutivo;
- si el servidor ya proceso la carga, devuelve el mismo ack.

Runbook operativo: `docs/runbooks/offline-replay-drill.md`.

## 8. SEO, AI-SEO y artefactos publicos

La superficie publica es pequena a proposito: una pagina canonica, metadata consistente y archivos faciles de consumir por buscadores y agentes.

- `robots.txt` solo permite la superficie publica aprobada.
- `sitemap.xml` publica URLs canonicas y excluye admin/kiosk.
- `llms.txt` describe producto, rutas publicas y limites de citacion.
- JSON-LD expone `WebPage`, `WebSite` y `AmusementPark` para extraccion semantica.

Criterios usados:

- Google Search Central para indexabilidad/canonicals/sitemap.
- buenas practicas de AI-SEO para contenido citable, `llms.txt`, y fronteras claras entre publico y privado.

Runbook operativo: `docs/runbooks/seo-ai-seo-validation-checklist.md`.

## 9. Seguridad y rollout

Flags actuales en `src/lib/hardeningPolicy.ts`:

- `OTP_HARDENING_ENABLED`
- `EXPORT_BOUNDS_ENFORCED`
- `PUBLIC_SEO_ENABLED`
- `CURSOR_PAGINATION_ENABLED`
- `ADMIN_AGGREGATES_ENABLED`
- `OFFLINE_QUEUE_ENABLED`
- `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`
- `CSP_REPORT_ONLY_ENABLED`

Principios:

- defaults seguros para hardening existente;
- defaults oscuros para capacidades nuevas con riesgo operativo;
- rollback por desactivar flag y redeploy, no por revertir datos.

Runbook operativo: `docs/runbooks/rollback-flags.md`.

## 10. Verificacion y evidencia

IaC rollout boundary: deploy Firebase indexes/rules first, then prewarm aggregates, then enable flags.

Exact composite-index parity is still a best-effort proof until emulator/query logs or deploy feedback confirm every live query shape.

Gates automatizados relevantes:

- `bun test`
- `bun run check:format`
- `bun run check:lint`
- `bun run check:types`
- `bun run check:phase5`

Cobertura Phase 5 y cierre incremental Block D/E2:

- SEO routes y `llms.txt`: `tests/seo-public.test.ts`, `tests/phase5-verification-hardening.test.ts`
- offline idempotency: `tests/offline-resilience.test.ts`
- cursor/admin aggregates: `tests/foundation-rollout-scaffolding.test.ts`, `tests/phase5-verification-hardening.test.ts`
- perimeter headers/CSP: `tests/proxy.security.test.ts`
- a11y pragmatica de primitives: `tests/block-b-a11y-and-logging.test.tsx`
- a11y browser smoke reproducible: `playwright/accessibility.a11y.ts` ejecutado con `bun run test:a11y:e2e`

Las notas manuales de a11y siguen vivas en runbooks porque la cobertura actual es smoke, no matriz completa. El estado real ahora es: SI hay browser automation con Axe/Playwright para superficies criticas, pero TODAVIA falta ampliar esa cobertura para todos los flujos admin/kiosk end-to-end.

## 11. Trazabilidad y decision records

Artefactos fuente de verdad para este cambio:

- propuesta: `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/proposal.md`
- diseno tecnico: `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/design.md`
- plan de ejecucion: `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/tasks.md`
- progreso apply: `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/apply-progress.md`

ADR candidates activos dentro de ese cambio:

- cursor vs offset en Firebase;
- plano agregado `admin_metrics`;
- arquitectura offline-first del kiosk.
