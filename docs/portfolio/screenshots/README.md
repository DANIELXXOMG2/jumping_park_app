# Screenshot capture checklist

## Required stills

- `kiosk-ingreso` - identificacion inicial con layout completo
- `kiosk-otp` - paso OTP con mensaje contextual visible
- `kiosk-consentimiento` - firma y resumen legal
- `kiosk-offline-success` - evidencia del estado diferido/offline cuando exista
- `admin-dashboard` - KPIs, chart y freshness visibles
- `admin-consents-list` - tabla con `signatureStatus`, sin signed URL expuesta
- `public-consentimiento-digital` - hero publico con CTA y narrativa canonica

## Capture rules

- usar viewport limpio y consistente
- ocultar correos, telefonos y documentos reales
- no cortar breadcrumbs, headers o indicadores importantes
- priorizar 16:10 o 16:9 para case study; sumar una captura mobile si el flujo lo justifica

## Placeholder policy

Si una captura todavia no existe, dejar una nota en el PR o en el portfolio manifest, no un PNG vacio.

## Authenticated admin captures

`scripts/capture-screenshots.ts` no usa el flujo de login de Firebase para
llegar a las rutas `/admin*`. En su lugar, para los jobs con
`surface === "admin"`, firma una cookie de sesion admin valida con
`ADMIN_JWT_SECRET` y la inyecta en el `BrowserContext` antes del primer
`page.goto(...)`. La cookie se construye con los mismos helpers que el
resto del codigo (`createAdminSessionPayload` + `buildAdminSessionCookieValue`
en `src/lib/adminAuth.ts`), por lo que el proxy la acepta sin cambios.

Requisitos para correr capturas admin:

- `ADMIN_JWT_SECRET` (mismo secret que usa el server)
- `ADMIN_CAPTURE_UID` y `ADMIN_CAPTURE_EMAIL` del usuario admin pre-sembrado

Overrides opcionales por CLI (tienen precedencia sobre las env vars):

- `--admin-uid <uid>`
- `--admin-email <email>`

Los jobs de kiosk y publico no requieren cookie; la resolucion devuelve un
array vacio y el comportamiento previo queda intacto.

## Production guard

Por defecto el script aborta con un error claro si `baseUrl` apunta a
`jumpingpark.lat` o a cualquier subdominio (`www.jumpingpark.lat`,
`staging.jumpingpark.lat`, etc.). Esto aplica tanto en `dry-run` como en
`write`, para que un reviewer no pueda ni siquiera previsualizar un plan
contra produccion.

Para correr contra produccion hay que pasar explicitamente:

- `--allow-production`

No hay shortcut. Si el flag no esta presente, el script termina con exit
code 1 y un mensaje que indica como desbloquear.

## PII / manual review

Antes de commitear cualquier captura:

- revisar el PNG con un visor (no fiarse solo del plan)
- confirmar que no hay correos, telefonos, documentos, ni nombres de menores
- confirmar que la sesion admin no expone el email real del usuario en
  headers, footers o menus laterales (anonimizar antes si hace falta)
- verificar que las URLs firmadas (signed URLs) no estan visibles en
  columnas, atributos `data-*` o tooltips
- mantener el commit atomico: `feat(screenshots): refresh <jobId>` y
  enlazarlo al PR de portfolio

