# Proposal: Production Hardening & Professionalization

## Intent

Asegurar la plataforma para su operación estable en producción cerrando vectores de abuso (OTP sin rate limit, sesiones de cliente vulnerables), optimizando costos en consultas pesadas (exportaciones), y profesionalizando el repositorio para facilitar la observabilidad y el despliegue seguro. Al mismo tiempo, se busca preparar una superficie pública amigable con SEO/AI-SEO separando el flujo transaccional privado de las páginas indexables.

## Scope

### In Scope
- Endurecer la autenticación del panel admin mediante sesiones seguras y protección de rutas robustas.
- Prevenir el abuso de OTP implementando límites de validación (throttling/lockout) y fail-closed seguro.
- Reducir costos operativos limitando exportaciones masivas y tiempos de expiración de signed URLs de Storage.
- Establecer un baseline de seguridad: headers HTTP estrictos, saneamiento de logs sensibles y políticas de noindex en zonas operativas.
- Profesionalizar el repositorio: actualizar README, crear `.env.example`, añadir scripts y runbooks básicos, configurar CI.
- Implementar una estrategia inicial de SEO técnico para una superficie pública (robots.txt, sitemap.xml, JSON-LD), aislada de las rutas operativas.

### Out of Scope
- Migrar de Firebase/Firestore a otra base de datos.
- Modificar el flujo de usuario principal o la UX/UI del kiosko de registro de forma disruptiva.
- Desarrollar nuevas características comerciales para el parque.
- Migrar a una arquitectura multi-repositorio.

## Capabilities

### New Capabilities
- `system-security`: Políticas perimetrales, rate limiting avanzado y prevención de abuso OTP.
- `observability`: Runbooks, backups, documentación y logging seguro.
- `seo-public`: Superficie pública optimizada para buscadores e IA, separada de la operativa.

### Modified Capabilities
- `user-auth`: Transición a manejo de sesión más seguro para administradores.
- `data-export`: Límites estrictos y optimización en las descargas de datos masivos.

## Approach

Se ejecutará un endurecimiento incremental (incremental hardening) en fases. Primero, un lote enfocado en seguridad perimetral y prevención de abusos para cerrar los riesgos inmediatos sin reestructurar el producto. Segundo, un lote de estabilidad para controlar costos de base de datos y estandarizar la operación. Finalmente, un lote de profesionalización del repositorio y SEO para mejorar la mantenibilidad y la presencia pública. Todo manteniendo el stack actual (Next.js 15, Bun, TypeScript).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/proxy.ts` | Modified | Protección perimetral y headers de seguridad. |
| `src/app/api/otp/` | Modified | Rate limiting en validación y lockout policies. |
| `src/contexts/AuthContext.tsx` | Modified | Modelo de sesión admin más seguro (menor dependencia del cliente). |
| `src/services/` | Modified | Sanear logs (authService) y ajustar signed URLs (consentService). |
| `src/app/api/admin/export/` | Modified | Limitar lecturas costosas y añadir paginación/restricciones. |
| `README.md` & `.env.example` | Modified/New | Profesionalización de documentación y configuración. |
| `src/app/(public)/` | New | Nueva superficie SEO-friendly con robots/sitemaps. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rotura de UX en kiosko por límites de OTP muy estrictos | Medium | Configurar budgets de intentos generosos y mensajes de error claros. |
| Problemas de sesión al cambiar modelo de auth admin | Low | Pruebas exhaustivas del flujo de login y reautenticación. |
| Impacto en rendimiento de exportaciones limitadas | Low | Comunicación clara en UI sobre los nuevos límites de descarga o asincronía. |

## Rollback Plan

Dado que los cambios se implementarán en PRs atómicos y graduales (lotes funcionales), cualquier regresión en producción se revertirá deshaciendo el PR específico problemático. No se planean migraciones de esquema destructivas en esta fase.

## Dependencies

- Ninguna dependencia externa bloqueante nueva.

## Success Criteria

- [ ] Todas las rutas `/api/otp/*` cuentan con rate limit comprobado sin fail-open riesgoso.
- [ ] Las URLs de los consentimientos firmados tienen expiración corta y segura.
- [ ] Los endpoints de exportación de datos no permiten dumps irrestrictos y costosos de toda la base.
- [ ] La documentación operativa (README) refleja exactamente el código, los scripts y las variables de entorno necesarias.
- [ ] Zonas transaccionales/operativas no son indexables, mientras que existe una superficie pública lista para SEO/AI-SEO.
