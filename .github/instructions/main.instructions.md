# Copilot Instructions — Jumping Park App (Refactor Phase)

## 1. Fuente de Verdad
- Ubicación de documentación: `/docs`, `ESTRUCTURA_PROYECTO.md`
- Regla: Código limpio, arquitectura hexagonal/clean donde sea posible.

## 2. Stack Oficial
| Capa | Tecnología | Detalles |
|------|------------|---------|
| Runtime | Bun | Latest |
| Framework | Next.js | App Router |
| Lenguaje | TypeScript | Strict |
| UI | React + Shadcn/ui | Tailwind CSS |
| BD | Firebase Firestore | [BLOQUEO_DOCUMENTAL: ¿Usamos reglas de seguridad estrictas?] |
| Auth | Firebase Auth | Custom Claims / Roles |
| Linter | Biome | Configuración en `biome.json` |

## 3. Arquitectura
- **Backend (API)**: Next.js API Routes.
- **Frontend**: Componentes de servidor (RSC) por defecto, Client Components solo para interactividad.
- **Patrón de Datos**: 
    - `services/`: Lógica de negocio pura.
    - `lib/firestoreService.ts`: Acceso a datos.
    - `app/api/`: Controladores HTTP (deben ser delgados).

## 4. Estándares de Calidad (DoD)
Para dar una tarea por terminada:
- [ ] 0 errores en `bun run audit:dead` (Knip).
- [ ] 0 duplicidad en `bun run audit:dupe` (JSCPD).
- [ ] Tipado estricto (Zod para validación de entrada/salida).
- [ ] Tests unitarios para nuevos servicios (Jest/Vitest) [BLOQUEO_DOCUMENTAL: Definir framework de testing].

## 5. Organización de Directorios (Clave)
- `src/components/ui`: Primitivas de diseño (no tocar lógica).
- `src/components/{feature}`: Componentes de negocio (ej. `kiosk`, `admin`).
- `src/lib`: Utilidades puras.
- `src/scripts`: Automatización (se ejecutan con Bun).