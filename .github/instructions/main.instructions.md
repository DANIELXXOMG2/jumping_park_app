INSTRUCCIONES_PROYECTO:
# Copilot Instructions — Jumping Park: Gestión de Consentimientos (v2.0)

## 🧠 Fuente de Verdad
- **Documentación:** PDFs cargados en `docs/` (Flujos, Interfaces, Requerimientos).
- **Prioridad:** Lo gratuito (Free Tier) es mandatorio. No generar gastos en Firebase ni Vercel.

## 🛠️ Stack Oficial
- **Framework:** Next.js 16 (App Router).
- **Lenguaje:** TypeScript (Strict Mode).
- **Estilos:** Tailwind CSS v4 + shadcn/ui.
- **Backend/DB:** Firebase Firestore (Cliente + Admin SDK).
- **Emails:** Resend (API).
- **Tema:** Soporte nativo Dark Mode (System/User preference).

## 📂 Convenciones y Reglas Críticas
1.  **Colecciones Firestore:**
    - `otp_sessions` (ANTERIORMENTE `otps` o `otp` - UNIFICAR AQUÍ).
    - `consents` (Consentimientos firmados).
    - `users` (Visitantes registrados).
2.  **Validación de Datos:**
    - **Zod** es OBLIGATORIO para todo input (API y Forms).
    - Fechas deben tener rangos lógicos (ej. nacimiento entre 1900 y fecha actual).
3.  **Manejo de NoSQL:**
    - La duplicación de datos solo se acepta si justifica una lectura más rápida (Denormalización).
    - Si se duplica, debe documentarse por qué.

## ✅ Definition of Done (DoD)
- Tipado estricto (no `any`).
- Linting limpio (ESLint/Prettier).
- Validación Zod implementada.
- Compatible con Dark Mode (verificar contrastes).

## Arquitectura Offline (Nuevo)
- **Motor PWA:** `@serwist/next`. Configuración compatible con Next.js 16.
- **Persistencia de Datos:** Firestore SDK v12 con `persistentLocalCache` y `persistentMultipleTabManager`.
- **Estrategia de Queries:** "Offline First". Las vistas críticas (lista de usuarios, validación de acceso) deben consultar por defecto caché local o suscribirse a ventanas de tiempo cortas (ej. 3-7 días) para minimizar descargas.
- **Indicadores UI:**
  - Si la data viene de caché (`fromCache: true`), mostrar badge amarillo warning.
  - Si hay escrituras pendientes (`hasPendingWrites: true`), mostrar indicador de "Sincronizando...".
- **Instalación:** Habilitar botón "Instalar App" en desktop (Chrome/Edge) interceptando `beforeinstallprompt`.

## Auth & OTP
- **WebOTP API:** Implementar hook progresivo. Prioridad a lectura automática de SMS en Android.
- **Fallback:** Inputs de OTP deben tener siempre `autocomplete="one-time-code"` y `inputMode="numeric"`.