# Production hardening hub

Este documento es la puerta de entrada operativa. Si vas a validar, habilitar o revertir una capacidad del roadmap, arrancas aca y despues seguis el runbook especializado.

Companeros actuales de este hub:

- `docs/README.md` para distinguir docs vigentes vs historicas.
- `docs/runbooks/dependency-risk-note.md` para el estado actual de `bun audit` y el riesgo residual aceptado (hoy: solo transitivo/tooling, no dependencias runtime directas reportadas).

## Orden recomendado

1. Confirmar flags y entorno con `docs/runbooks/rollback-flags.md`.
2. Validar admin cost plane con `docs/runbooks/admin-cost-smoke-checklist.md`.
3. Ejecutar drill offline con `docs/runbooks/offline-replay-drill.md` si `OFFLINE_QUEUE_ENABLED=true` y `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=true`.
4. Validar SEO/AI-SEO + notas a11y con `docs/runbooks/seo-ai-seo-validation-checklist.md` antes de abrir indexacion.
5. Revisar `docs/runbooks/dependency-risk-note.md` antes de endurecer el gate de dependencias o aceptar upgrades grandes.

Firebase IaC parity: review `firebase/firestore.indexes.json`, `firebase/firestore.rules`, and `firebase/storage.rules` before any flag enablement.

## Smoke pack minimo por release

- `bun test`
- `bun test tests/phase4-production-artifacts.test.ts`
- `bun run check:lint`
- `bun run check:types`
- `bun run check:phase5`

## Nota importante sobre CI

- `bun run check:format` y `bun run check:lint` ya no escriben archivos.
- Si necesitás corregir localmente, usá `bun run fix:format` y `bun run fix:lint`.
- No uses un gate que muta el workspace: eso rompe reproducibilidad y te ensucia la evidencia.

## Criterio de aprobacion

No habilitar flags nuevos en produccion si falta alguno de estos puntos:

- rollback documentado y probado;
- smoke de costo admin estable;
- replay offline sin duplicados cuando aplica;
- SEO/AI-SEO validado sobre el deploy real;
- notas manuales de a11y registradas.

## Limitaciones vigentes que NO hay que maquillar

- Dependencias: `bun audit` sigue mostrando riesgo residual transitivo/tooling. El gate actual bloquea hallazgos directos nuevos, pero no inventa que la deuda upstream ya desaparecio.
- Accesibilidad: ya existe smoke browser reproducible con Axe/Playwright (`bun run test:a11y:e2e`), pero todavia no cubre una matriz E2E completa de todas las rutas admin/kiosk.

## CSP staged tightening

- Baseline enforced: `src/proxy.ts` siempre emite un CSP activo con `frame-src 'none'`, `object-src 'none'`, `worker-src 'self' blob:`, `manifest-src 'self'` y sin origenes remotos amplios para scripts.
- Canary opcional: `CSP_REPORT_ONLY_ENABLED=true` agrega un header `Content-Security-Policy-Report-Only` mas estricto para observar compatibilidad antes de endurecer enforcement.
- Limitacion conocida: `unsafe-inline` sigue presente por compatibilidad con el runtime actual y el JSON-LD inline del surface publico; NO lo saques en produccion sin primero cubrir nonces/hashes y smoke browser real.
