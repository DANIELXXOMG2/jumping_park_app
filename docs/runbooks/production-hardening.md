# Production Hardening Smoke Pack

Use this smoke pack after each hardening PR or before production rollout. All examples assume the app is running at `http://localhost:3000`; replace the origin as needed for preview or production.

## 1. Admin session smoke

Goal: confirm the cookie-first admin session works, and `ADMIN_SESSION_MODE=dual` still accepts the Bearer baseline during rollout.

### 1.1 Cookie-first session baseline

1. Sign in from `POST /api/admin/session` with a valid Firebase ID token.

```bash
curl -i -X POST http://localhost:3000/api/admin/session \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<firebase-id-token>"}'
```

Expected:
- `HTTP/1.1 200 OK`
- `Set-Cookie: jp_admin_session=...; HttpOnly; Path=/; SameSite=Lax`
- JSON body contains `session.role` and `session.expiresAt`

2. Reuse the cookie against an admin API.

```bash
curl -i http://localhost:3000/api/admin/session \
  -H "Cookie: jp_admin_session=<cookie-from-login>"
```

Expected:
- `HTTP/1.1 200 OK`
- body confirms `authenticated: true`
- no `WWW-Authenticate` challenge

3. Hit a protected admin route without cookie.

```bash
curl -i http://localhost:3000/admin/usuarios
```

Expected:
- `HTTP/1.1 307 Temporary Redirect`
- `Location: /admin/login?redirect=%2Fadmin%2Fusuarios&reason=session-required`
- `X-Robots-Tag: noindex, nofollow`

### 1.2 Dual-mode Bearer fallback baseline

Precondition: `ADMIN_SESSION_MODE=dual`.

```bash
curl -i http://localhost:3000/api/admin/roles \
  -H "Authorization: Bearer <firebase-id-token>"
```

Expected:
- `HTTP/1.1 200 OK`
- request succeeds without `jp_admin_session`
- use only during rollout; remove from smoke once cookie-only mode is enabled

## 2. OTP abuse and lock behavior

Goal: verify request throttling and validation lockouts stay stable.

### 2.1 Request budget: 3 in 5 minutes

Replay the same request four times.

```bash
curl -i -X POST http://localhost:3000/api/otp \
  -H "Content-Type: application/json" \
  -d '{"cedula":"12345678"}'
```

Expected:
- attempts 1-3: `HTTP/1.1 200 OK`
- attempt 4: `HTTP/1.1 429 Too Many Requests`
- headers include `Retry-After: <seconds>`
- body includes `{"code":"OTP_RATE_LIMITED","retryAfter":<seconds>}`

### 2.2 Validation lock after 5 bad codes

Submit an incorrect code five times for the same pending challenge.

```bash
curl -i -X POST http://localhost:3000/api/otp/validate \
  -H "Content-Type: application/json" \
  -d '{"cedula":"12345678","code":"000000"}'
```

Expected:
- attempts 1-4: `HTTP/1.1 404 Not Found`
- attempt 5: `HTTP/1.1 429 Too Many Requests`
- headers include `Retry-After: <seconds>`
- body includes `{"code":"OTP_LOCKED","error":"Session locked","retryAfter":<seconds>}`

## 3. Export bounds behavior

Goal: confirm admin exports reject unbounded and wide ranges with explicit metadata.

### 3.1 Reject missing `to`

```bash
curl -i "http://localhost:3000/api/admin/export/users?from=2026-01-01" \
  -H "Cookie: jp_admin_session=<cookie-from-login>"
```

Expected:
- `HTTP/1.1 400 Bad Request`
- body mentions `Los exports requieren un rango acotado con from y to.`

### 3.2 Reject `>30d` range

```bash
curl -i "http://localhost:3000/api/admin/export/consents?field=signedAt&from=2026-01-01&to=2026-02-01" \
  -H "Cookie: jp_admin_session=<cookie-from-login>"
```

Expected:
- `HTTP/1.1 400 Bad Request`
- body mentions `El rango maximo permitido es de 30 dias.`

### 3.3 Accept bounded range and inspect headers

```bash
curl -i "http://localhost:3000/api/admin/export/users?field=createdAt&from=2026-01-01&to=2026-01-30" \
  -H "Cookie: jp_admin_session=<cookie-from-login>"
```

Expected:
- `HTTP/1.1 200 OK`
- CSV body downloads normally
- headers include:
  - `X-Export-Range-Field: createdAt`
  - `X-Export-Range-From: 2026-01-01`
  - `X-Export-Range-To: 2026-01-30`
  - `X-Export-Max-Days: 30`
  - `X-Export-Rejected: false`

## 4. Robots and sitemap checks

Goal: confirm only the public SEO surface is discoverable.

### 4.1 `robots.txt`

```bash
curl -i http://localhost:3000/robots.txt
```

Expected:
- `HTTP/1.1 200 OK`
- content includes:
  - `Allow: /consentimiento-digital`
  - `Disallow: /admin/`
  - `Disallow: /ingreso/`
  - `Disallow: /otp/`
  - `Sitemap: https://www.jumpingpark.lat/sitemap.xml`

### 4.2 `sitemap.xml`

```bash
curl -i http://localhost:3000/sitemap.xml
```

Expected:
- `HTTP/1.1 200 OK`
- XML contains only public URLs
- current baseline contains `https://www.jumpingpark.lat/consentimiento-digital`
- XML does not include `/admin`, `/ingreso`, `/otp`, `/registro`, `/consentimiento`, or `/exito`

### 4.3 Verify page-source boundary

```bash
curl -s http://localhost:3000/consentimiento-digital
curl -i http://localhost:3000/
```

Expected public page (`/consentimiento-digital`):
- has `<script type="application/ld+json">`
- has canonical metadata for `/consentimiento-digital`
- renders indexable robots metadata

Expected kiosk root (`/`):
- header `X-Robots-Tag: noindex, nofollow`
- HTML includes `<meta name="robots" content="noindex, nofollow">`

## Rollback notes

- If public discovery must be rolled back, remove the public route entries from `src/app/robots.ts` and `src/app/sitemap.ts`, then revert the page metadata in `src/app/(public)/consentimiento-digital/page.tsx`.
- If admin cookie rollout fails, keep `ADMIN_SESSION_MODE=dual` and rerun Section 1 before attempting cookie-only mode.
