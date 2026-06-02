# Short demo script

Composicion HyperFrames: `docs/portfolio/motion/composition/`
Duracion total: 44.5s (slice 1 de N, solo lint/validate/preview en esta iteracion).

## Timeline (slice 1)

| t (s)        | Track     | Clip                          | Notas                                      |
| ------------ | --------- | ----------------------------- | ------------------------------------------ |
| 0.0 - 10.5   | 1 (img)   | `scene-kiosk`                 | kiosco ingreso                             |
| 0.4 - 10.0   | 5 (title) | `title-kiosk`                 | fade in desde arriba                       |
| 10.0 - 20.5  | 2 (img)   | `scene-admin-dash`            | crossfade de entrada sobre scene-kiosk     |
| 10.4 - 20.0  | 6 (title) | `title-admin-dash`            | fade in desde arriba                       |
| 20.0 - 30.5  | 3 (img)   | `scene-admin-consents`        | crossfade de entrada sobre scene-admin-dash|
| 20.4 - 30.0  | 7 (title) | `title-admin-consents`        | fade in desde arriba                       |
| 30.0 - 42.0  | 4 (img)   | `scene-public`                | crossfade de entrada sobre scene-admin-consents |
| 30.4 - 40.0  | 8 (title) | `title-public`                | fade in desde arriba                       |
| 42.0 - 44.5  | 9 (outro) | `outro-card`                  | nota final: portfolio en construccion      |

Las transiciones entre escenas son crossfades suaves logrados con
`gsap.from(opacity 0)` sobre el clip entrante (la imagen previa se mantiene
visible hasta el fin de su `data-duration`). La ultima escena hace fade a
negro y muestra la nota final, que es el unico `gsap.to(opacity 0)` permitido
(regla: solo la escena final puede hacer fade out).

## Capturas usadas (source of truth)

- `docs/portfolio/screenshots/kiosk-ingreso.png`
- `docs/portfolio/screenshots/admin-dashboard.png`
- `docs/portfolio/screenshots/admin-consents-list.png`
- `docs/portfolio/screenshots/public-consentimiento-digital.png`

Estas mismas imagenes estan copiadas en `composition/assets/` porque el CLI
sirve la raiz del proyecto y no resuelve `..` por encima del root servido.
La fuente de verdad sigue siendo `docs/portfolio/screenshots/`.

## Pendiente (futuras escenas, no incluidas en este slice)

- `kiosk-otp` - paso OTP con mensaje contextual
- `kiosk-consentimiento` - firma y resumen legal
- `kiosk-offline-success` - estado diferido / offline
- posible cierre con `robots.txt` o `llms.txt` como evidencia de polish tecnico

## Validacion local

```bash
npx hyperframes lint    docs/portfolio/motion/composition
npx hyperframes validate docs/portfolio/motion/composition
npx hyperframes inspect  docs/portfolio/motion/composition
```

Ver `docs/portfolio/motion/README.md` para notas de produccion y limites del slice.
