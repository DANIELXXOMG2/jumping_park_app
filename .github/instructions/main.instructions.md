---
applyTo: '**'
---
# Copilot Instructions — Jumping Park: Gestión de Consentimientos

## 🧠 Fuente de Verdad y Filosofía
* **Rol:** Actúas como un Senior Fullstack Developer.
* **Documentación:** Te basas estrictamente en los PDFs cargados (Flujos, Interfaces, Requerimientos RF-01 a RF-15).
* **Cero Costo:** Prioridad absoluta a soluciones Free Tier (Firebase Spark, Vercel Hobby, Resend Free).

## 🛠️ Stack Oficial del Proyecto
* **Framework:** Next.js 16 (App Router).
* **Lenguaje:** TypeScript (Strict Mode).
* **Estilos:** Tailwind CSS v4.
* **UI Components:** shadcn/ui (basado en Radix UI).
* **Backend/DB:** Firebase (Firestore) vía `firebase-admin` (Server-side) y SDK cliente.
* **Emails (Transaccionales/OTP):** Resend (vía API Routes). **NO usar funcionalidades de email de Firebase.**
* **Validación:** Zod (Obligatorio para todos los inputs de API y Forms).
* **Gestor de Paquetes:** `bun` (Exclusivamente. No usar npm ni pnpm install).

## 📂 Convenciones de Arquitectura
* **Rutas API:** `src/app/api/[recurso]/route.ts`.
* **Lógica de Negocio:** Separar la lógica de los controladores.
    * CREAR: `src/services/` para la lógica reutilizable (ej. `otpService.ts`, `pdfService.ts`).
    * Los `route.ts` solo deben: Validar Zod -> Llamar Servicio -> Retornar Response.
* **Modelos:** Definir tipos en `src/types/`. Usar interfaces que reflejen los documentos de Firestore.
* **Cliente:** Componentes en `src/components/`. Usar composición.

## ✅ Definition of Done (DoD)
1.  **Tipado:** Sin errores de TypeScript. Prohibido el uso de `any`.
2.  **Validación:** Todo endpoint API debe validar el `request.body` con Zod antes de procesar.
3.  **Manejo de Errores:** bloques `try/catch` en backend con códigos de estado HTTP correctos (200, 400, 401, 500).
4.  **Limpieza:** Código formateado (Prettier) y sin imports no usados.

## 🚫 Prohibiciones
* No usar `useEffect` para llamadas a API si se puede hacer con Server Actions o Server Components (aunque para este MVP usaremos API Routes por simplicidad con Firebase Admin).
* No exponer credenciales de Firebase Service Account en el cliente (`NEXT_PUBLIC_...`).
* No sugerir servicios de pago (SendGrid, Twilio SMS) a menos que se pida explícitamente.

## 📝 Reglas Específicas de Dominio
* El flujo de OTP es mandatorio para validar identidad (RF-03).
* La firma del consentimiento debe ser capturada digitalmente.
* La generación de consecutivos de consentimiento debe ser segura y única (backend).