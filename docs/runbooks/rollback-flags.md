# Rollback flags

Este runbook define como revertir rapido las capacidades agregadas sin tocar datos productivos. Todos los cambios de este roadmap son additive-first: el rollback es por flag + redeploy.

## Matriz de rollback

| Flag | Cuando desactivarlo | Efecto esperado | Riesgo residual |
| --- | --- | --- | --- |
| `CURSOR_PAGINATION_ENABLED` | cursores invalidos, drift de paginacion, soporte incidente | vuelve a `offset` | mayor costo de lectura |
| `ADMIN_AGGREGATES_ENABLED` | stale metrics o inconsistencia de agregados | vuelve a stats live | mas lecturas y mas latencia |
| `OFFLINE_QUEUE_ENABLED` | cola corrupta, replay dudoso, incidente kiosk | desactiva replay backend | si el flag publico sigue activo queda un rollout parcial |
| `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` | UI offline inestable, storage local corrupto, incidente kiosk | desactiva queue UX/runtime en navegador | si el flag server sigue activo no se capturan nuevas colas |
| `CSP_REPORT_ONLY_ENABLED` | ruido excesivo en reportes o incompatibilidad de terceros | elimina header report-only | menor visibilidad preventiva |
| `PUBLIC_SEO_ENABLED` | noindex urgente, contenido publico no aprobado | `robots` bloquea todo y sitemap queda vacio | perdida temporal de discoverability |

## Procedimiento

1. Confirmar el flag afectado y el sintoma.
2. Cambiar la variable de entorno en el ambiente afectado.
3. Redeploy obligatorio para preview/produccion.
4. Validar el estado post-rollback con el runbook correspondiente.
5. Registrar evidencia: hora, responsable, motivo, y ambiente.

Si hay drift de indices/reglas, redeploy de `firestore.indexes.json`, `firestore.rules` y `storage.rules` antes de reactivar flags.

Nota: el rollout offline es dual. Normalmente se cambian `OFFLINE_QUEUE_ENABLED` y `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` juntos para evitar estados mixtos.

## Verificaciones por rollback

### Cursor rollback

- `GET /api/admin/users?offset=0&limit=20` responde correctamente.
- `pageInfo.nextCursor` puede quedar `null`; eso es aceptable en fallback.
- el incidente de costo queda contenido solo como medida temporal.

### Aggregates rollback

- `/api/admin/stats` y `/api/admin/stats/detailed` responden desde live reads.
- la UI sigue mostrando `freshness`, pero la fuente puede pasar a `live`.

### Offline rollback

- el kiosk deja de aceptar nuevas escrituras offline solo si tambien se desactiva `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`.
- las colas existentes no se borran automaticamente: conservar hasta decidir replay o limpieza manual.

### CSP rollback / canary rollback

- `CSP_REPORT_ONLY_ENABLED=false` elimina solo el canary report-only; el baseline enforced sigue activo.
- si el problema viene del baseline enforced, tratarlo como incidente de seguridad y corregir allowlists/directivas en `src/proxy.ts` antes del siguiente deploy.

### SEO rollback

- `robots.txt` muestra `Disallow: /`.
- `sitemap.xml` no lista rutas publicas.
- `/consentimiento-digital` vuelve a `noindex, nofollow`.

## Evidencia minima

- ambiente afectado;
- flag cambiado;
- redeploy asociado;
- smoke ejecutado;
- decision de follow-up.
