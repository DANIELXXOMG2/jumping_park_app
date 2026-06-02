# Rollback flags

This runbook defines how to roll back the shipped capabilities quickly without touching production data. Every change in this roadmap is additive-first: the rollback path is flag + redeploy.

## Rollback matrix

| Flag | When to disable it | Expected effect | Residual risk |
| --- | --- | --- | --- |
| `CURSOR_PAGINATION_ENABLED` | invalid cursors, pagination drift, cost-support incident | falls back to `offset` | higher read cost |
| `ADMIN_AGGREGATES_ENABLED` | stale metrics or aggregate inconsistency | falls back to live stats | more reads and more latency |
| `OFFLINE_QUEUE_ENABLED` | corrupted queue, replay doubt, kiosk incident | disables backend replay | if the public flag stays enabled, the rollout remains partial |
| `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` | unstable offline UI, corrupted local storage, kiosk incident | disables queue UX/runtime in the browser | if the server flag stays enabled, no new queues are captured |
| `CSP_REPORT_ONLY_ENABLED` | excessive report noise or third-party incompatibility | removes the report-only header | lower preventive visibility |
| `PUBLIC_SEO_ENABLED` | urgent noindex need, unapproved public content | `robots` blocks everything and the sitemap becomes empty | temporary discoverability loss |

## Procedure

1. Confirm the affected flag and the symptom.
2. Change the environment variable in the affected environment.
3. Redeploy is mandatory for preview/production.
4. Validate the post-rollback state with the corresponding runbook.
5. Record evidence: time, owner, reason, and environment.

If index/rules drift exists, redeploy `firestore.indexes.json`, `firestore.rules`, and `storage.rules` before re-enabling flags.

Note: the offline rollout is dual. Normally `OFFLINE_QUEUE_ENABLED` and `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` are changed together to avoid mixed states.

## Rollback verification

### Cursor rollback

- `GET /api/admin/users?offset=0&limit=20` responds correctly.
- `pageInfo.nextCursor` may become `null`; that is acceptable in fallback mode.
- The cost incident remains contained only as a temporary measure.

### Aggregates rollback

- `/api/admin/stats` and `/api/admin/stats/detailed` respond from live reads.
- The UI still shows `freshness`, but the source may switch to `live`.

### Offline rollback

- The kiosk stops accepting new offline writes only if `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` is also disabled.
- Existing queues are not deleted automatically: keep them until replay or manual cleanup is decided.

### CSP rollback / canary rollback

- `CSP_REPORT_ONLY_ENABLED=false` removes only the report-only canary; the enforced baseline remains active.
- If the problem comes from the enforced baseline, treat it as a security incident and fix allowlists/directives in `src/proxy.ts` before the next deploy.

### SEO rollback

- `robots.txt` shows `Disallow: /`.
- `sitemap.xml` does not list public routes.
- `/consentimiento-digital` falls back to `noindex, nofollow`.

## Minimum evidence

- affected environment;
- changed flag;
- associated redeploy;
- smoke executed;
- follow-up decision.
