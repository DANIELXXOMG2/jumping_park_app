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

## DOM-level redaction (admin)

Las capturas admin aplican redaccion a nivel DOM **antes** de tomar el
screenshot. Cada job puede declarar una lista de `redactions` con la
forma:

```
{ selector: string, action: "hide" | "replace-text", replacement?: string }
```

- `hide` aplica `style.visibility = "hidden"` (preserva el layout).
- `replace-text` reemplaza el `textContent` del nodo (o usa `[REDACTED]`
  cuando no se pasa `replacement`).

Los selectores apuntan a atributos `data-pii` que los componentes admin
renderizan para mantener la lista corta y revisable. La configuracion
inicial cubre el email del header admin, la card de resultado de busqueda
del dashboard, y las celdas obvias de PII (nombre, id, email, telefono)
en la tabla de consentimientos.

**Importante:** esto es redaccion visual del lado cliente, **no** una
mutacion de datos. No reemplaza la revision manual: el revisor debe
abrir el PNG antes de commitear y confirmar que no hay PII visible.

**Alcance actual:** rutas `/admin` y `/admin/consentimientos` (hide
para header email + search card, replace-text para celdas de PII de la
tabla) y `kiosk-consentimiento` (replace-text sobre
`[data-pii='kiosk-consent-name']` y `[data-pii='kiosk-consent-uid']`).
La firma y el recuadro del documento legal siguen visibles para
sanity-check del revisor.

## Capture seeder (`KioskCaptureSeeder`)

`kiosk-otp` y `kiosk-consentimiento` necesitan un visitante valido en
`useKioskStore` para renderizar la entrada real (no la pantalla de
fallback "sin datos"). El seeder es un componente opt-in que vive en
`src/components/kiosk/KioskCaptureSeeder.tsx`, montado dentro de
`KioskLayoutShell` **antes** de `KioskSessionRestorer`.

Como opera:

1. La pipeline agrega `?captureSeed=<base64(JSON({uid, email, fullName}))>`
   al `route` del job (`/otp?captureSeed=...`,
   `/consentimiento?captureSeed=...`).
2. El seeder lee el param, decodifica el JSON y empuja los datos al
   store via `useKioskStore.getState().updateVisitorData(...)` +
   `setAuthenticated(true)` en `useLayoutEffect`. Asi, cuando el
   restorer evalua la ruta, ya ve el estado hidratado y no redirige a
   `/`.
3. En produccion el param nunca esta presente: el seeder es no-op y
   no toca el store.

Contratos importantes:

- El seeder **debe** estar antes del restorer en el JSX. Cambiar el
  orden rompe el `/consentimiento?captureSeed=...` porque el restorer
  cae en su rama de "ruta protegida sin sesion" y redirige a `/`
  antes de que el store se hidrate.
- En `/otp` el seeder setea `isAuthenticated: true` para que la pagina
  muestre el formulario en vez de la guia de fallback; el restorer no
  intenta redirigir (no es una ruta publica cuando esta autenticado,
  pero `/otp` SI esta en `PUBLIC_ROUTES`, asi que se setea
  intencionalmente para que la captura muestre la entrada).

## Offline-success capture labeling

`kiosk-offline-success` se captura contra `/exito?offline=1&nombre=Demo`
navegacion directa, no contra un `context.setOffline(true)` durante un
flujo real. La pagina renderiza el estado diferido ("Pendiente" +
"Guardado localmente") gateado solo por el query param, asi que el
resultado visual es identico al flujo real de offline.

El manifest marca la fila con la nota `[QUERY-PARAM-OFFLINE]` para que
cualquier revisor entienda que la captura es simulada pero visualmente
truthful. Si en algun momento se quiere capturar el flujo real con
`setOffline`, agregar un nuevo job dedicado y no reemplazar este: el
plan actual ya cubre lo que la UI muestra hoy.

