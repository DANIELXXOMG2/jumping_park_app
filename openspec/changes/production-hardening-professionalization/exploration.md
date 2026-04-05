## Exploration: production-hardening-professionalization

### Current State
El repo ya tiene base moderna (`Next.js 16`, `React 19`, `TypeScript strict`, `Bun`), pero la preparación para producción está fragmentada entre seguridad, costos operativos, discoverability y profesionalización del repo.

**Problema actual**
- Seguridad: el panel admin depende de tokens de Firebase en cliente y de un guard de UI; `src/proxy.ts` deja pasar rutas `/admin/*` y solo agrega tres headers básicos, mientras `src/contexts/AuthContext.tsx` y `src/lib/adminAuth.ts` usan `Bearer` tokens desde el cliente, no sesiones `HttpOnly` como afirma `README.md`.
- OTP y abuso: solo `src/app/api/otp/route.ts` aplica rate limiting; `src/app/api/otp/validate/route.ts` no limita intentos de validación, `src/services/rateLimitService.ts` hace fail-open ante error, y `src/services/authService.ts` deja reutilizar OTPs por una hora y loguea el código esperado cuando falla la validación.
- SEO / AI-SEO: `src/app/layout.tsx` tiene metadata global y `robots.index = true`, pero no existen `src/app/robots.ts`, `src/app/sitemap.ts` ni JSON-LD. Hoy la app indexable es principalmente un flujo transaccional de kiosko/admin, no una superficie pública de adquisición.
- Costos / escalabilidad: hay optimizaciones puntuales (`count()`, límites en stats), pero siguen existiendo lecturas/exportaciones amplias (`src/app/api/admin/export/users/route.ts`, `src/app/api/admin/export/consents/route.ts`, `src/app/api/admin/stats/detailed/route.ts`) y URLs firmadas de firmas con expiración al año 2500 en `src/services/consentService.ts`.
- Profesionalismo repo: la documentación operativa no refleja el código real. `README.md` referencia `.env.example` inexistente, comandos como `bun lint` y claims de `JWT + HttpOnly`, además de colecciones y TTLs que no coinciden con `src/services/authService.ts`, `firebase/firestore.rules` y `package.json`. Tampoco hay workflows en `.github/workflows/`.

### Affected Areas
- `src/proxy.ts` — protección real de rutas, headers y estrategia de hardening perimetral.
- `src/contexts/AuthContext.tsx` — modelo actual de sesión admin basado en Firebase client tokens.
- `src/components/admin/AdminGuard.tsx` — autorización dependiente del cliente y cache en `sessionStorage`.
- `src/lib/adminAuth.ts` — verificación backend de claims; base para endurecer permisos.
- `src/app/api/otp/route.ts` — rate limit de solicitud OTP.
- `src/app/api/otp/validate/route.ts` — falta de rate limit de validación / lockout.
- `src/services/rateLimitService.ts` — política fail-open y dependencia de Firestore para throttling.
- `src/services/authService.ts` — logging sensible y semántica de expiración/reutilización OTP.
- `src/services/consentService.ts` — signed URLs muy largas, snapshots PII y costo por Storage/exports.
- `src/app/layout.tsx` — metadata global, robots e indexación actual.
- `README.md` — principal brecha de profesionalización y onboarding.
- `package.json` — baseline real de scripts/calidad; evidencia de drift documental.
- `scripts/backup.ts` — existe backup, pero sin restore ni runbook operativo.
- `firebase/firestore.rules` / `firebase/storage.rules` — postura real de acceso a datos y archivos.

### Approaches
1. **Hardening incremental sobre la app actual** — endurecer auth, OTP, headers, docs y límites sin reestructurar producto.
   - Pros: menor riesgo, PRs chicos, aprovecha patrones existentes, time-to-value rápido.
   - Cons: mantiene acoplados marketing, kiosko y admin dentro del mismo surface; SEO queda limitado si no se separan zonas indexables.
   - Effort: Medium

2. **Separación explícita de superficies (`public` vs `operational`)** — tratar kiosko/admin como aplicación operativa no indexable y crear una superficie pública/SEO aparte.
   - Pros: mejor seguridad por aislamiento conceptual, SEO/AI-SEO más limpio, mejor narrativa de producto.
   - Cons: más coordinación, más decisiones de routing/contenido, mayor esfuerzo inicial.
   - Effort: High

### Recommendation
Recomiendo un enfoque híbrido por fases: arrancar con **hardening incremental** para cerrar riesgos reales de producción y, en paralelo, preparar la **separación de superficies** como resultado del mismo cambio. En términos prácticos: primero asegurar auth, OTP, headers, límites y documentación; después profesionalizar observabilidad/operación; recién entonces abrir una capa pública indexable con SEO/AI-SEO deliberado. Eso ataca el riesgo HOY sin disparar complejidad innecesaria.

**Alcance propuesto**
- Endurecer autenticación admin y acceso a rutas, reduciendo la dependencia de guards solo del cliente.
- Cerrar vectores de abuso de OTP: rate limit también en validación, lockout/attempt budget, logs sanitizados y política fail-closed o degradación controlada.
- Establecer baseline de seguridad de plataforma: headers, cookies/sesiones si aplica, política de exportaciones, PII logging, manejo de signed URLs.
- Reducir riesgo/costo operativo en endpoints de export y estadísticas pesadas.
- Alinear repo con realidad operativa: README, `.env.example`, scripts reales, runbooks mínimos, CI de calidad.
- Redefinir la estrategia SEO/AI-SEO: qué indexa, qué no indexa, y qué contenido público merece structured data.

**Exclusiones**
- No reescribir Firestore por otra base de datos.
- No cambiar el core UX del kiosko salvo ajustes necesarios por seguridad.
- No introducir features comerciales nuevas ajenas al hardening/profesionalización.
- No migrar a una arquitectura multi-repo en esta etapa.

### Risks
- **Seguridad vs UX**: bajar la tolerancia en OTP/session puede aumentar fricción en kiosko; hace falta un presupuesto de intentos y mensajes claros para no romper operación presencial.
- **SEO vs privacidad**: indexar el flujo actual mejora discoverability cero y aumenta exposición de rutas operativas; conviene noindexar superficies transaccionales y concentrar SEO en contenido público.
- **Costo vs complejidad**: limitar lecturas/exportaciones y firmar acceso corto reduce riesgo, pero puede exigir jobs diferidos, auditoría y nuevos flujos de descarga.
- **Documentación vs velocidad**: corregir README/ops parece secundario, pero hoy hay drift suficiente para inducir deploys incorrectos y falsas suposiciones de seguridad.
- **Session model migration**: pasar de bearer tokens cliente a una sesión más robusta puede requerir cambios cross-cutting en admin UI y APIs.

**Estrategia de rollout en producción (commits/PRs graduales)**
- PR 1 / Commit set: `security-baseline` — auth admin, OTP validate throttling, logs sanitizados, security headers, noindex operativo inicial.
- PR 2 / Commit set: `operational-stability` — límites/costos en exports y stats, backup/restore/runbooks, observabilidad mínima, consistencia de handlers.
- PR 3 / Commit set: `repo-professionalization` — README real, `.env.example`, CI/workflows, checks y documentación operativa.
- PR 4 / Commit set: `public-discoverability` — robots/sitemap/structured data y superficie pública indexable separada del flujo kiosko/admin.
- Cada PR debe poder desplegarse y revertirse sola; evitar mega-PR que mezcle seguridad con growth.

**Propuesta de lotes de implementación**
- **Lote 1 - Crítico**: auth/admin hardening, OTP abuse prevention, log sanitization, security headers, policy de indexación/noindex para zonas operativas.
- **Lote 2 - Estabilidad**: límites de costo en exports/stats, signed URL posture, backup + restore plan, estandarización de route handlers, observabilidad mínima.
- **Lote 3 - Crecimiento**: landing pública indexable, `robots`/`sitemap`, JSON-LD, metadata segmentada, AI-SEO content surface y activos de marca/documentación pública.

### Ready for Proposal
Yes — el cambio ya tiene evidencia suficiente para pasar a `sdd-propose`. La propuesta debería fijar una secuencia explícita: primero seguridad y operación, después profesionalización del repo, y por último discoverability/AI-SEO con una superficie pública separada.
