# Jumping Park · Gestión de Consentimientos

Plataforma fullstack (Next.js 16 + Firebase) para registrar accesos, consentimientos y flujos OTP del parque Jumping Park. Toda la lógica sensible corre en API Routes usando `firebase-admin`, por lo que las reglas de Firestore/Storage bloquean el acceso directo desde clientes.

## Stack oficial

- Next.js 16 (App Router) + React 19 (Strict/Server Components friendly)
- TypeScript estricto + Zod para validaciones
- Tailwind CSS v4 + shadcn/ui (Radix) para UI
- Firebase Admin SDK (Firestore + Storage)
- Resend para correos transaccionales OTP
- Gestor único: **bun**

## Estructura relevante

```text
src/
  app/api/otp/route.ts           -> solicita OTP
  app/api/otp/validate/route.ts  -> valida OTP
  lib/firestoreService.ts        -> CRUD genérico tipado (Firestore)
  lib/schemas/auth.schema.ts     -> Zod schemas send/validate OTP
  services/authService.ts        -> saveOtp, sendOtpEmail, validateOtp
  types/firestore.ts             -> tipos oficiales (users, consents, otps)
firebase/
  firestore.rules                -> acceso mínimo necesario
  storage.rules                  -> control de firmas digitales
postman/jumpingpark_collection.postman_collection.json -> pruebas locales
```

## Configuración rápida

1. **Clonar e instalar**

   ```bash
   bun install
   ```

2. **Variables de entorno** (`.env.local`)

   ```bash
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   FIREBASE_STORAGE_BUCKET=
   RESEND_API_KEY=
   ```

   > Los endpoints usan Admin SDK; nunca expongas las credenciales en el cliente.

3. **Servidor de desarrollo**

   ```bash
   bun dev
   ```

4. **Linters**

   ```bash
   bun lint
   ```

## Flujo OTP (Sprint 1.4)

1. `POST /api/otp`
   - Valida `{ email, cedula }` con `sendOtpSchema` (Zod).
   - Genera código de 6 dígitos → `authService.saveOtp` lo guarda en la colección `otps` usando el email como ID (TTL de 10 minutos, `attempts = 0`).
   - Envía correo vía Resend (`authService.sendOtpEmail`). Si falla Firestore se aborta sin mandar correo.
2. `POST /api/otp/validate`
   - Valida `{ email, code }` con `validateOtpSchema`.
   - `authService.validateOtp` compara código, revisa expiración y elimina el documento para impedir reutilización.
   - Respuestas: `200 { success: true }` o `400 { success: false, error }`.

### Colección Postman

Importa `postman/jumpingpark_collection.postman_collection.json`, ajusta la variable `baseUrl` y ejecuta las peticiones anteriores mientras corres `bun dev` (por defecto en `http://localhost:3000`).

## Seguridad Firebase

- **Firestore (`firebase/firestore.rules`)**
  - `/users/{userId}`: `allow read, write: if request.auth.uid == userId`.
  - `/otps/{email}`: acceso totalmente bloqueado (solo Admin SDK).
  - `/consents/{consentId}`: lectura restringida al dueño (`resource.data.userId`), escritura bloqueada.
  - Default: deny all.
- **Storage (`firebase/storage.rules`)**
  - `/signatures/{fileName}`: lectura/escritura solo para usuarios autenticados.
  - Default: deny all.
- **Despliegue**

  ```bash
  firebase deploy --only firestore:rules,storage:rules
  ```

## Scripts útiles

```bash
bun dev        # servidor Next.js
bun build      # build de producción
bun start      # servir .next/standalone
bun lint       # ESLint (config Next 16)
```

## Próximos pasos sugeridos

1. Integrar UI (shadcn/ui) para capturar OTP y firmas.
2. Añadir pruebas E2E (Puppeteer/Playwright) para los flujos críticos.
3. Automatizar el despliegue de reglas con GitHub Actions (`firebase deploy`).
