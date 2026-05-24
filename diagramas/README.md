# Diagramas raiz

Este directorio contiene los diagramas editables de referencia rapida del proyecto. La fuente narrativa principal sigue siendo `docs/ARQUITECTURA.md`, pero los `.mmd` del root deben reflejar la arquitectura real actual del producto.

## Estado

- **Estado**: Current editable reference
- **Uso recomendado**: explicar visualmente el flujo kiosk/OTP/consent/offline y el modelo de colecciones Firestore
- **Formato fuente**: Mermaid (`.mmd`)
- **Formato exportado**: SVG (`.svg`) cuando se pueda regenerar desde los `.mmd`

## Fuente vigente

- `Diagrama-Secuencia.mmd` - flujo completo kiosk/OTP/consent/offline
- `auth-sequence.mmd` - ciclo de vida OTP (challenge → validate → session → consent guard) + admin auth
- `docs/ARQUITECTURA.md` - narrativa arquitectonica actual
- `docs/reference/firebase.md` - referencia Firebase (colecciones, reglas, indices, auth)
- `docs/README.md` - mapa de documentacion vigente vs historica
- `docs/portfolio/diagrams/README.md` - guia para transformar estos diagramas en assets curados de storytelling

## Nota editorial

Si la arquitectura real cambia, primero actualiza `docs/ARQUITECTURA.md` y luego sincroniza estos diagramas. Si no se puede regenerar el SVG en el mismo batch, el `.mmd` manda como fuente de verdad.
