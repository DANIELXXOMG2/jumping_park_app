# SEO and AI-SEO validation checklist

Este checklist mezcla tres cosas que TIENEN que convivir: indexabilidad real, claridad para agentes, y una validacion manual minima de accesibilidad de la superficie publica.

## Preconditions

- `PUBLIC_SEO_ENABLED=true`
- deploy fresco del ambiente a validar
- URL real del ambiente disponible

## Search engine checks

- `robots.txt` responde `200` y no expone admin ni rutas privadas del kiosk.
- `sitemap.xml` lista solo URLs publicas canonicas.
- `/consentimiento-digital` expone `title`, `description`, canonical y Open Graph coherentes.
- la pagina publica incluye JSON-LD valido.
- cuando el flag esta apagado, `robots.txt` vuelve a `Disallow: /` y la ruta publica queda `noindex`.

## AI-SEO checks

- `/llms.txt` responde `text/plain`.
- el archivo describe el producto, lista URLs publicas y deja claro que admin/kiosk/API son privados.
- la URL canonica preferida coincide con la del sitemap.
- la narrativa publica es corta, citable y sin claims inventados.
- no se publican rutas privadas como si fueran surface marketing.

## Public-page a11y smoke notes

La superficie publica es chica, asi que la verificacion manual tambien debe ser precisa:

- navegar con teclado desde el inicio hasta el CTA principal;
- verificar un solo `h1` y jerarquia logica de headings;
- probar zoom/browser text resize al 200% sin clipping horizontal critico;
- validar contraste visible en CTA y texto principal;
- confirmar que enlaces tienen destino entendible fuera de contexto.

## Cobertura automatizada disponible vs gap real

- Cobertura de regression de primitives: `tests/block-b-a11y-and-logging.test.tsx` valida semantica modal, teclado en filas interactivas y el wrap de foco esperado para dialogos.
- Cobertura browser reproducible en repo: `bun run test:a11y:e2e` (Playwright + Axe) sobre `/consentimiento-digital` y un surface kiosk critico.
- Gap explicito actual: esta cobertura es smoke E2E, no reemplaza una matriz completa de navegacion asistiva para todo admin/kiosk.
- Siguiente paso cuando entre en alcance: ampliar `playwright/accessibility.a11y.ts` con rutas admin clave y escenarios de foco/zoom extendidos.

## Evidence pack

- captura de `robots.txt`
- captura de `sitemap.xml`
- view-source o evidencia del JSON-LD
- captura o nota de `llms.txt`
- nota corta de a11y smoke: teclado + zoom + headings

## Recommended external validators

- Google Rich Results Test
- Schema.org Validator
- PageSpeed Insights o Lighthouse SEO
- chequeo manual en al menos un agente con web access para confirmar que la URL canonica es facil de citar
