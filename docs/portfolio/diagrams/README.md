# Diagram guidance

## Diagrams that add real value

- data plane: kiosk -> consentService -> Firestore/Storage -> admin metrics
- rollout map: flags, defaults y rollback path
- offline replay: queue local -> replay -> `offline_sync` -> ack final
- public discovery plane: public route + `robots` + `sitemap` + `llms.txt`

## Style rules

- fondo claro o neutro, tipografia legible, maximo 5-7 nodos por bloque
- usar el mismo naming que el repo: `admin_metrics`, `offline_sync`, `otp_challenges`
- evitar iconografia decorativa que no aporte arquitectura
- exportar SVG o Mermaid editable cuando sea posible

## Suggested source of truth

- `docs/ARQUITECTURA.md`
- `diagramas/Diagrama-Secuencia.mmd`
- `diagramas/Diagrama-de-Entidad-Relacion.mmd`
- `docs/README.md`

