# DevTwin Architect — Jumping Park App (Reference)

> **Estado:** Refactorizado (Sprint 2.3)
> **Stack:** Next.js 16 (App Router) + Bun + Biome + Firebase

## 1. Principios de Calidad (Definition of Done)
Para considerar una tarea terminada, debe pasar el pipeline de calidad unificado:
- **Comando Obligatorio:** `bun run check` (debe retornar exit code 0).
    - ✅ **Format & Lint:** Biome (Strict).
    - ✅ **Type Check:** TypeScript (No emit).
    - ✅ **Dead Code:** Knip (Sin errores críticos).
    - ✅ **Duplicación:** JSCPD (< 2% permitido).
    - ✅ **Ciclos:** Dependency Cruiser (0 ciclos).

## 2. Arquitectura de Backend (API)
Evitar lógica de negocio en `route.ts`. Usar capas:
1.  **Middleware (`src/lib/api-middleware.ts`):** - Maneja Auth (`withAdminAuth`), validación Zod y errores `try/catch`.
2.  **Servicios (`src/services/`):** - Lógica pura (CRUD, reglas de negocio).
    - Ejemplos: `userService.ts`, `staffService.ts`.
3.  **Data Access (`src/lib/firestoreService.ts`):** - Solo interacción directa con Firebase.

## 3. Arquitectura de Frontend (UI)
- **Componentes Compartidos:** - Tablas complejas → `src/components/admin/ConsentTable.tsx`
    - Modales base → `src/components/kiosk/MinorModalBase.tsx`
- **Hooks:** Lógica de estado/fetch en `src/hooks/` (ej. `useConsentsTable.ts`).
- **Keys:** NUNCA usar `index` como key en listas. Usar IDs únicos o generarlos.
- **Accesibilidad:** Botones siempre con `type="button" | "submit"`.

## 4. Flujo de Trabajo con IA
Al solicitar código a Copilot/DevTwin:
1.  Pedir explícitamente **Servicios** en lugar de lógica inline.
2.  Exigir **Tipado Estricto** (evitar `any`).
3.  Solicitar verificación de duplicación si se crea UI similar a la existente.

## 5. Comandos Clave
| Acción | Comando |
|:---|:---|
| **Chequeo Completo** | `bun run check` (CI Gate) |
| **Dev Server** | `bun run dev` |
| **Auto-fix Lint** | `biome check src/ --write` |
| **Analizar Bundle** | `bun run analyze` |