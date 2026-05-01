# Documentacion actual del repo

Este indice refleja el estado integrado del clean clone **despues de los Batches 1-4** del workflow `git-corrupted-reapply-workflow`.

La regla editorial sigue igual de estricta: cada documento se marca segun su uso real hoy. Si un archivo conserva contexto viejo, roadmap o material historico, se dice explicitamente en vez de venderlo como verdad operativa.

## Current / usable hoy

| Documento | Estado | Uso real hoy |
| --- | --- | --- |
| `docs/README.md` | Current | Mapa de verdad para separar documentacion actual vs historica |
| `CONTRIBUTING.md` | Current | Flujo de contribucion, calidad y SDD del repo |
| `CLAUDE.md` | Current | Convenciones operativas, comandos Bun y arquitectura vigente |
| `diagramas/README.md` | Current | Guia de diagramas editables presentes en el repo |
| `diagramas/Diagrama-Secuencia.mmd` | Current | Mermaid editable del flujo de alto nivel |
| `diagramas/Diagrama-de-Entidad-Relación.mmd` | Current | Mermaid editable del mapa de datos actual/referencial |
| `docs/ARQUITECTURA.md` | Current | Narrativa tecnica vigente para kiosk, admin, SEO y rollout flags |
| `docs/runbooks/production-hardening.md` | Current | Hub operativo para smoke checks, flags y release hardening |
| `docs/runbooks/dependency-risk-note.md` | Current | Estado actual del riesgo de dependencias y politica de seguimiento |
| `docs/runbooks/rollback-flags.md` | Current | Matriz de rollback de flags y condiciones de reversa |
| `docs/runbooks/offline-replay-drill.md` | Current | Drill del replay offline para el rollout controlado |
| `docs/runbooks/admin-cost-smoke-checklist.md` | Current | Checklist de costo admin para cursor/aggregates |
| `docs/runbooks/seo-ai-seo-validation-checklist.md` | Current | Checklist de SEO, AI-SEO y smoke de accesibilidad |
| `docs/portfolio/README.md` | Current | Plan curado de captura y storytelling, vigente aunque no todos los assets existan todavia |

## Reference / leer con contexto

| Documento | Estado | Nota |
| --- | --- | --- |
| `docs/portfolio/diagrams/README.md` | Reference | Guia de curacion para diagramas de portfolio; apoya al material actual pero no reemplaza `docs/ARQUITECTURA.md` |
| `docs/portfolio/screenshots/README.md` | Reference | Checklist de capturas reales para portfolio/demo |
| `docs/portfolio/motion/demo-script.md` | Reference | Guion de motion/GIF para storytelling, no contrato runtime |
| `docs/portfolio/branding/logo-usage.md` | Reference | Recomendaciones visuales para presentacion externa |
| `docs/portfolio/artifact-manifest.template.md` | Reference | Plantilla de inventario para assets reales |

## Historical / referencia solamente

| Documento | Estado | Nota |
| --- | --- | --- |
| `docs/MANUAL_USUARIO.md` | Historical | Snapshot funcional previo |
| `docs/MANUAL_INSTALACION.md` | Historical | Manual de despliegue anterior |
| `docs/INFORME_TECNICO_SPRINT_3.md` | Historical | Informe puntual, no guia vigente |
| `docs/ESTRUCTURA_PROYECTO.md` | Historical | Mapa legacy; validar contra el repo real |

## Regla editorial

- Si cambia el estado real del repo, actualiza primero `README.md` y este indice.
- `Current` significa usable hoy como verdad operativa o guia activa, aunque el documento describa un plan honesto (por ejemplo portfolio capture).
- `Reference` significa apoyo util o curado, pero no la fuente primaria de verdad tecnica/operativa.
- `Historical` significa contexto viejo que no debe competir con la documentacion vigente.
- Si un archivo apunta a roadmap archivado, runbooks o assets, la referencia tiene que existir realmente en el repo.
