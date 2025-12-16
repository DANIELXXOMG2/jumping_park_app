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
- Manejo de errores try/catch en Server Actions/API Routes.