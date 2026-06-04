# Portfolio assets plan

Este directorio organiza evidencia visual real del producto. La regla es simple: nada fake. Si todavia no existe el asset final, se deja una guia o checklist, no un binario inventado.

Hoy este directorio sigue siendo principalmente un **plan curado de captura**. Puede convivir con diagramas editables reales en `diagramas/`, pero no implica que todas las capturas finales ya existan.

## Estructura

- `docs/portfolio/screenshots/` - capturas still del kiosk, admin y superficie publica.
- `docs/portfolio/diagrams/` - guia para convertir los diagramas tecnicos actuales en assets curados de storytelling.
- `docs/portfolio/motion/` - guion de GIF/video corto y checklist de toma. Una composicion HyperFrames narration-ready con narracion TTS real y capturas reales vive aca; ver `docs/portfolio/motion/README.md`.
- `docs/portfolio/branding/` - recomendaciones de logo, naming y consistencia visual.
- `docs/portfolio/evidence/` - plantillas de evidencia externa (Lighthouse, Rich Results, AI citation log, Search Console). Vacias hasta tener un run real; no se inventan resultados.
- `docs/portfolio/artifact-manifest.md` - manifiesto del render local real, audio usado y decision de audio bed.

## Alcance de esta carpeta

- Esto es un **plan curado de portfolio**, no una promesa de que cada asset ya exista en el repo.
- Las capturas o diagramas solo se agregan cuando son reales, revisados y utiles para contar el producto sin inventar evidencia.
- El directorio raiz `diagramas/` queda fuera de este alcance: hoy es material **legacy/reference**, no el paquete curado para portfolio.

## Convenciones

- nombrar archivos con fecha y surface: `2026-04-kiosk-consent-step.png`
- exportar capturas reales, sin mockups generados por IA
- mostrar datos anonimizados o de demo, nunca PII real
- mantener una historia clara: problema -> flujo -> hardening -> resultado
- cada asset debe poder trazarse a una feature o runbook real del repo
- si reutilizas un diagrama existente, primero confirma que representa el estado actual; no heredes diagramas root por inercia

## Hero set recomendado

1. kiosco: ingreso, OTP, consentimiento y exito offline/online
2. admin: dashboard con freshness, tabla cursor-first, detalle de consentimiento
3. publico: `/consentimiento-digital`, `robots.txt`, `llms.txt`
4. diagrama: data plane kiosk/admin/public

## Checklist de salida

- assets capturados en desktop y mobile/tablet cuando aplique
- copy corto listo para portfolio o case study
- referencias cruzadas a `README.md`, `docs/ARQUITECTURA.md` y runbooks
- aclaracion del estado cuando un asset siga pendiente, legacy o solo como referencia

