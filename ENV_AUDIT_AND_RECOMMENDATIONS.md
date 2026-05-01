# Auditoría de Variables de Entorno y Configuración Recomendada

> Estado: auditoría basada en **uso real en código**, no solo en `.env.example`.
> Fecha: 2026-04-29
> Proyecto: `jumping_park_app`

---

## Resumen ejecutivo

Desde el punto de vista **del código del repo**, gran parte del runtime cae en **defaults seguros** cuando ciertas envs no están declaradas. Pero para una operación estable en producción, eso **no es suficiente**: las variables críticas y las operativas de rollout deben estar **explícitamente declaradas** para evitar depender de defaults invisibles.

### Hallazgos más importantes

- El repo requiere credenciales base de Firebase/Resend/Admin para operar correctamente.
- Si esas credenciales ya existen en el entorno desplegado, la siguiente prioridad es declarar explícitamente las variables operativas nuevas, especialmente:
  - `ADMIN_SESSION_MODE`
  - `ADMIN_IDLE_TIMEOUT_MINUTES`
  - `OTP_LOCKOUT_MINUTES`
  - `OTP_HARDENING_ENABLED`
  - `EXPORT_BOUNDS_ENFORCED`
  - `PUBLIC_SEO_ENABLED`
  - `CURSOR_PAGINATION_ENABLED`
  - `ADMIN_AGGREGATES_ENABLED`
  - `OFFLINE_QUEUE_ENABLED`
  - `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`
  - `CSP_REPORT_ONLY_ENABLED`
- Hoy la app probablemente funciona por estos defaults de código:
  - `ADMIN_SESSION_MODE=dual`
  - `ADMIN_IDLE_TIMEOUT_MINUTES=30`
  - `OTP_LOCKOUT_MINUTES=15`
  - `OTP_HARDENING_ENABLED=true`
  - `EXPORT_BOUNDS_ENFORCED=true`
  - `PUBLIC_SEO_ENABLED=true`
  - `CURSOR_PAGINATION_ENABLED=false`
  - `ADMIN_AGGREGATES_ENABLED=false`
  - `OFFLINE_QUEUE_ENABLED=false`
  - `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=false`
  - `CSP_REPORT_ONLY_ENABLED=false`

### Decisiones operativas confirmadas

- **OTP válido por 1 hora**: ya coincide con el código actual.
- **Sesión OTP válida por 2 horas**: ya coincide con el código actual.
- **Sesión admin en 15 minutos**: **NO** es lo actual ni lo recomendado para este caso de uso.
  - El código hoy usa **30 minutos**.
  - Además, la sesión admin tiene **refresh deslizante** si el operador sigue activo.
  - Para cajero/recepción, **30 minutos** es mejor equilibrio que 15.

---

## Qué se va a hacer / criterio recomendado

### Objetivo inmediato

1. **Explicitar** en Vercel las variables operativas críticas que hoy faltan.
2. Mantener los flags nuevos en modo **seguro por defecto** hasta validar rollout real.
3. No activar todavía en producción:
   - `CURSOR_PAGINATION_ENABLED`
   - `ADMIN_AGGREGATES_ENABLED`
   - `OFFLINE_QUEUE_ENABLED`
   - `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`
4. Mantener explícitos y estables:
   - OTP hardening
   - export bounds
   - sesión admin
   - lockout OTP

### Filosofía de configuración

- **Primero estabilidad**, después optimización.
- Las envs más importantes son las que afectan:
  1. disponibilidad del backend,
  2. autenticación,
  3. seguridad,
  4. costo/lecturas,
  5. UX del kiosk y del admin.

---

## Cómo leer este documento

Cada variable tiene estas secciones:

- **Uso real en código**: dónde vive en el repo.
- **Qué hace**: explicación técnica.
- **En lenguaje simple**: explicación para operación/negocio.
- **Riesgo si falta o está mal**: qué tan grave es.
- **Recomendación**: el valor sugerido hoy.

---

## 1) Variables críticas para que la app no se rompa

### `FIREBASE_PROJECT_ID`
### `FIREBASE_CLIENT_EMAIL`
### `FIREBASE_PRIVATE_KEY`
### `FIREBASE_STORAGE_BUCKET`

**Uso real en código**
- `src/lib/firebaseAdmin.ts`

**Qué hacen**
- Inicializan Firebase Admin.
- Sin esto fallan Firestore, Auth Admin y Storage.

**En lenguaje simple**
- Son las credenciales del “motor interno” de la app.
- Si estas variables están mal, la app puede dejar de leer usuarios, guardar consentimientos o subir firmas.

**Riesgo si faltan o están mal**
- Muy alto.
- Puede romper rutas admin, creación de consentimientos, uploads de firmas y queries.

**Recomendación**
- Deben existir en **Production / Preview / Development**.
- `FIREBASE_PRIVATE_KEY` debe estar serializada con `\n` correctamente.

---

### `NEXT_PUBLIC_FIREBASE_API_KEY`
### `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
### `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
### `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
### `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
### `NEXT_PUBLIC_FIREBASE_APP_ID`

**Uso real en código**
- Firebase client/browser.

**Qué hacen**
- Inicializan el SDK cliente en navegador.

**En lenguaje simple**
- Son la “identidad pública” que usa el frontend para hablar con Firebase.
- Si faltan, el browser no sabe con qué proyecto conectarse.

**Riesgo si faltan o están mal**
- Alto.
- Rompen auth client, panel admin client o partes del kiosk/public browser runtime.

**Recomendación**
- Deben existir en **Production / Preview / Development**.

---

### `RESEND_API_KEY`

**Uso real en código**
- `src/services/emailService.ts`

**Qué hace**
- Envío de OTP por correo.
- Reenvío manual de consentimientos.

**En lenguaje simple**
- Es la llave del servicio que manda los correos.
- Si falla, los usuarios no reciben el código OTP.

**Riesgo si falta o está mal**
- Alto para UX.
- El flujo OTP se degrada fuerte.

**Recomendación**
- Obligatoria en **Production**.
- Muy recomendable en **Preview**.

---

## 2) Variables críticas de seguridad y sesiones

### `ADMIN_JWT_SECRET`

**Uso real en código**
- `src/lib/adminAuth.ts`

**Qué hace**
- Firma/verifica la cookie de sesión admin.

**En lenguaje simple**
- Es la clave con la que el sistema “sella” la sesión del admin para que no se pueda falsificar.

**Riesgo si falta o está mal**
- Muy alto.
- La sesión admin puede no funcionar o ser insegura.

**Recomendación**
- Obligatoria en **Production / Preview**.
- Debe ser larga, aleatoria y rotada si hay sospecha de exposición.

---

### `ADMIN_SESSION_MODE`

**Uso real en código**
- `src/lib/adminAuth.ts:8-9`

**Qué hace**
- Define si el admin usa:
  - solo cookie (`cookie`)
  - cookie + bearer fallback (`dual`)

**En lenguaje simple**
- Le dice al sistema si acepta una sola forma de sesión admin o dos formas a la vez.
- `dual` es más tolerante y ayuda a no romper el acceso admin durante transiciones.

**Default de código**
- `dual`

**Recomendación**
```env
ADMIN_SESSION_MODE=dual
```

---

### `ADMIN_IDLE_TIMEOUT_MINUTES`

**Uso real en código**
- `src/lib/adminAuth.ts:10-15`
- refresh en `src/services/adminSessionService.ts:141-172`
- polling/refresh client en `src/contexts/AuthContext.tsx:170-233`

**Qué hace**
- Define expiración/idle de la cookie admin.

**En lenguaje simple**
- Es el tiempo máximo que puede estar “quieta” una sesión admin antes de expirar.
- Si el admin sigue usando el panel, la sesión se puede refrescar automáticamente.

**Default de código**
- `30`

**Tu caso de uso**
- Cajero/recepción confirma usuarios uno por uno durante la jornada.
- Ahí **15 min** puede ser demasiado molesto.

**Recomendación**
```env
ADMIN_IDLE_TIMEOUT_MINUTES=30
```

**Comentario operativo**
- `30` es un buen equilibrio entre seguridad y comodidad.
- `45` también podría ser razonable si la operación se corta mucho.
- Yo no arrancaría con `15`.

---

### `OTP_LOCKOUT_MINUTES`

**Uso real en código**
- `src/services/authService.ts:26-29`

**Qué hace**
- Tiempo de bloqueo luego de demasiados intentos fallidos.

**En lenguaje simple**
- Si una persona se equivoca demasiadas veces poniendo el OTP, esta variable define cuánto debe esperar antes de volver a intentar.

**Default de código**
- `15`

**Recomendación**
```env
OTP_LOCKOUT_MINUTES=15
```

---

## 3) Variables que afectan directamente UX / admin / operación diaria

### `OTP_HARDENING_ENABLED`

**Uso real en código**
- `src/lib/hardeningPolicy.ts`
- OTP request/validate

**Qué hace**
- Activa throttling, lockouts y hardening de OTP.

**En lenguaje simple**
- Le dice al sistema si debe ponerse “estricto” con los OTP para evitar abuso, spam o brute force.

**Default de código**
- `true`

**Recomendación**
```env
OTP_HARDENING_ENABLED=true
```

---

### `EXPORT_BOUNDS_ENFORCED`

**Uso real en código**
- `src/services/exportRangeService.ts`
- export routes admin

**Qué hace**
- Obliga exportes acotados.

**En lenguaje simple**
- Evita que alguien desde admin pida un export gigante que vuelva lenta la app o dispare costos innecesarios.

**Default de código**
- `true`

**Recomendación**
```env
EXPORT_BOUNDS_ENFORCED=true
```

---

### Confirmación explícita sobre OTP y sesión kiosk

**Código actual**
- OTP code expira en **60 minutos**
- Sesión OTP validada dura **120 minutos**

**En lenguaje simple**
- El usuario tiene hasta 1 hora para usar el código OTP.
- Una vez validado, puede seguir en el flujo durante 2 horas sin tener que pedir otro OTP.

**Tu decisión**
- OTP válido **1h** → ya coincide con el código.
- Sesión válida **2h** → ya coincide con el código.

**Recomendación práctica**
- Para UX kiosk/familias, esto es razonable.
- Estos tiempos **ya quedaron expuestos por env** y conviene dejarlos explícitos así:
```env
OTP_EXPIRATION_MINUTES=60
OTP_SESSION_DURATION_MINUTES=120
```

---

## 4) Flags de rollout / costo / discoverability

Estas son muy buenas variables, pero no para dejarlas activadas “porque sí”.

### `PUBLIC_SEO_ENABLED`

**Uso real en código**
- `src/lib/seo.ts`

**Qué hace**
- Decide si la superficie pública indexa o no.

**En lenguaje simple**
- Es el interruptor que define si Google y otros motores pueden descubrir la página pública o no.

**Default**
- `true`

**Recomendación**
```env
PUBLIC_SEO_ENABLED=true
```
solo si el contenido público está aprobado.

---

### `CURSOR_PAGINATION_ENABLED`

**Qué hace**
- Habilita cursor-first pagination en admin.

**En lenguaje simple**
- Cambia la forma en que admin navega listas grandes para que cueste menos y escale mejor.

**Default**
- `false`

**Recomendación prod hoy**
```env
CURSOR_PAGINATION_ENABLED=false
```

---

### `ADMIN_AGGREGATES_ENABLED`

**Uso real en código**
- `src/app/api/admin/stats/route.ts`
- `src/services/adminMetricsService.ts`

**Qué hace**
- Hace que stats lean `admin_metrics/*` en vez de live queries.

**En lenguaje simple**
- Le dice al dashboard si mostrar métricas calculadas previamente (más rápidas/baratas) o calcular todo en vivo (más costoso, pero más simple).

**Default**
- `false`

**Recomendación prod hoy**
```env
ADMIN_AGGREGATES_ENABLED=false
```

---

### `OFFLINE_QUEUE_ENABLED`
### `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`

**Uso real en código**
- server + browser dual

**Qué hacen**
- backend replay / aceptación
- frontend UX/runtime offline

**En lenguaje simple**
- Son el par de interruptores del “modo offline”.
- Uno prende la parte del servidor.
- El otro prende la parte visible del kiosk.

**Default**
- ambos `false`

**Recomendación prod hoy**
```env
OFFLINE_QUEUE_ENABLED=false
NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=false
```

**Regla de oro**
- Deben ir **alineadas**.
- Nunca activar una sola.

---

### `CSP_REPORT_ONLY_ENABLED`

**Uso real en código**
- `src/proxy.ts`

**Qué hace**
- Activa una CSP más estricta en modo `Report-Only`.

**En lenguaje simple**
- Permite observar si una política de seguridad más dura rompería algo, sin romperlo todavía.

**Default**
- `false`

**Recomendación prod estable**
```env
CSP_REPORT_ONLY_ENABLED=false
```

---

## 5) Variables sensibles de bootstrap / setup

### `ALLOW_ADMIN_SETUP`

**Uso real en código**
- `src/app/api/admin/set-admin/route.ts`

**Qué hace**
- Habilita un endpoint extremadamente sensible para bootstrap admin.

**En lenguaje simple**
- Si esto está en `true`, existe una puerta especial para dar permisos de admin. Eso solo debería usarse en setup controlado, nunca como estado normal de producción.

**Recomendación**
```env
ALLOW_ADMIN_SETUP=false
```

---

### `ADMIN_SECRET_KEY`

**Uso real en código**
- endpoint `/api/admin/set-admin`

**Qué hace**
- Protege el bootstrap de admin.

**En lenguaje simple**
- Es la “clave maestra” del endpoint de setup admin.

**Recomendación**
- Si `ALLOW_ADMIN_SETUP=false`, no rompe nada tenerla.
- Pero si ya no la necesitás, podrías eventualmente retirarla de prod.

---

## 6) Variables de scripts / local / tooling

### `FIRESTORE_EMULATOR_HOST`

**Uso real**
- scripts

**En lenguaje simple**
- Sirve para apuntar herramientas locales al emulador, no a la base real.

**Recomendación**
- No necesaria en Vercel runtime.

---

### `FIREBASE_SERVICE_ACCOUNT_KEY`

**Uso real**
- scripts de seed/migrate/admin tooling

**En lenguaje simple**
- Es una forma alternativa de darle credenciales a scripts operativos.

**Recomendación**
- No necesaria en Vercel runtime.

---

### `ANALYZE`

**Uso real**
- `next.config.ts`

**Qué hace**
- Activa bundle analyzer.

**En lenguaje simple**
- Sirve para inspeccionar el tamaño del bundle. No ayuda a que la app funcione mejor en producción por sí sola.

**Recomendación**
```env
ANALYZE=false
```

---

## Configuración recomendada por entorno

## Production

```env
ADMIN_SESSION_MODE=dual
ADMIN_IDLE_TIMEOUT_MINUTES=30
OTP_LOCKOUT_MINUTES=15
OTP_HARDENING_ENABLED=true
EXPORT_BOUNDS_ENFORCED=true
PUBLIC_SEO_ENABLED=true
CURSOR_PAGINATION_ENABLED=false
ADMIN_AGGREGATES_ENABLED=false
OFFLINE_QUEUE_ENABLED=false
NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=false
CSP_REPORT_ONLY_ENABLED=false
ALLOW_ADMIN_SETUP=false
ANALYZE=false
```

## Preview

```env
ADMIN_SESSION_MODE=dual
ADMIN_IDLE_TIMEOUT_MINUTES=30
OTP_LOCKOUT_MINUTES=15
OTP_HARDENING_ENABLED=true
EXPORT_BOUNDS_ENFORCED=true
PUBLIC_SEO_ENABLED=true
CURSOR_PAGINATION_ENABLED=false
ADMIN_AGGREGATES_ENABLED=false
OFFLINE_QUEUE_ENABLED=false
NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=false
CSP_REPORT_ONLY_ENABLED=true
ALLOW_ADMIN_SETUP=false
ANALYZE=false
```

## Development

```env
ADMIN_SESSION_MODE=dual
ADMIN_IDLE_TIMEOUT_MINUTES=30
OTP_LOCKOUT_MINUTES=15
OTP_HARDENING_ENABLED=true
EXPORT_BOUNDS_ENFORCED=true
PUBLIC_SEO_ENABLED=true
CURSOR_PAGINATION_ENABLED=false
ADMIN_AGGREGATES_ENABLED=false
OFFLINE_QUEUE_ENABLED=false
NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=false
CSP_REPORT_ONLY_ENABLED=false
ALLOW_ADMIN_SETUP=false
ANALYZE=false
```

---

## Recomendaciones finales

1. **Actualizar Vercel ya** con las envs operativas faltantes.
2. Mantener explícito lo que hoy está implícito por defaults.
3. No activar rollout flags nuevos en producción hasta validación real de parity/rules.
4. Mantener:
   - OTP hardening encendido
   - export bounds encendido
   - admin session en `dual`
   - admin idle timeout en `30`
5. Si querés más control fino a futuro, exponer a env:
   - `OTP_EXPIRATION_MINUTES`
   - `OTP_SESSION_DURATION_MINUTES`

---

## Conclusión

La app hoy depende de defaults de código **razonables**, pero una operación seria en producción necesita que las envs operativas estén **declaradas de forma explícita**.

Si solo tuviera que priorizar 10, estas serían mis primeras 10 obligatorias para Vercel:

1. `ADMIN_SESSION_MODE=dual`
2. `ADMIN_IDLE_TIMEOUT_MINUTES=30`
3. `OTP_LOCKOUT_MINUTES=15`
4. `OTP_HARDENING_ENABLED=true`
5. `EXPORT_BOUNDS_ENFORCED=true`
6. `PUBLIC_SEO_ENABLED=true`
7. `CURSOR_PAGINATION_ENABLED=false`
8. `ADMIN_AGGREGATES_ENABLED=false`
9. `OFFLINE_QUEUE_ENABLED=false`
10. `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=false`

Y además:

11. `CSP_REPORT_ONLY_ENABLED=false`
12. `ALLOW_ADMIN_SETUP=false`
13. `ANALYZE=false`
