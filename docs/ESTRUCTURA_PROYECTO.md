# Estructura del Proyecto Jumping Park App

Este documento describe la organización de directorios y ficheros del proyecto, facilitando la navegación y entendimiento del código fuente.

## Raíz del Proyecto

En la raíz se encuentran los archivos de configuración principales y las carpetas de alto nivel.

*   **`biome.json`**: Configuración para Biome (linter y formatter).
*   **`components.json`**: Configuración para `shadcn/ui`.
*   **`firebase.json`**: Configuración de despliegue y emuladores de Firebase.
*   **`knip.json`**: Configuración para detectar código no utilizado.
*   **`next.config.ts`**: Configuración del framework Next.js.
*   **`package.json`**: Dependencias y scripts del proyecto (usa `bun`).
*   **`tailwind.config.ts`**: Configuración de estilos Tailwind CSS.
*   **`tsconfig.json`**: Configuración de TypeScript.

## Directorios Principales

### `/src` - Código Fuente
El núcleo de la aplicación Next.js.

*   **`/src/app`**: Rutas y páginas de la aplicación (App Router).
    *   **`(admin)`**: Grupo de rutas para el panel de administración (layouts y páginas protegidas).
    *   **`(kiosk)`**: Grupo de rutas para la interfaz del kiosco (registro, consentimiento, etc.).
    *   **`/api`**: Endpoints de la API Backend (Next.js API Routes).
    *   **`/offline`**: Página mostrada cuando no hay conexión a internet (PWA).
    *   **`globals.css`**: Estilos globales.
    *   **`layout.tsx`**: Layout raíz de la aplicación.

*   **`/src/components`**: Componentes de React reutilizables.
    *   **`/admin`**: Componentes específicos del panel de administración (tablas, cards, sidebar).
    *   **`/kiosk`**: Componentes específicos de la experiencia de kiosco.
    *   **`/ui`**: Componentes base de interfaz (botones, inputs, modales), generalmente de `shadcn/ui`.
    *   **`/emails`**: Plantillas de correo electrónico (React Email).

*   **`/src/contexts`**: Contextos de React para estado global.
    *   `AuthContext.tsx`: Manejo de sesión y autenticación.
    *   `LanguageContext.tsx`: Manejo de internacionalización.

*   **`/src/hooks`**: Hooks personalizados (ej. `useConsents`, `useOfflineData`).

*   **`/src/lib`**: Utilidades, configuraciones y lógica de negocio compartida.
    *   `firebaseClient.ts` / `firebaseAdmin.ts`: Inicialización de Firebase.
    *   `firestoreService.ts`: Lógica de acceso a datos.
    *   `schemas/`: Esquemas de validación (Zod).
    *   `utils/`: Funciones auxiliares generales.

*   **`/src/services`**: Capa de servicios para lógica compleja (Emails, PDF, Auth).

*   **`/src/store`**: Gestión de estado global con librerías externas (ej. Zustand para `kioskStore.ts`).

*   **`/src/types`**: Definiciones de tipos TypeScript globales (`auth.ts`, `firestore.ts`).

### `/public`
Archivos estáticos servidos directamente (imágenes, iconos, manifiesto PWA).
*   `manifest.json`: Configuración para la PWA.
*   `/assets`: Recursos gráficos.

### `/scripts`
Scripts de utilidad para mantenimiento, migración de datos y tareas administrativas.
*   `seed-database.ts`: Script para poblar la base de datos con datos de prueba.
*   `migrate-*.ts`: Scripts de migración de estructuras de datos.

### `/firebase`
Configuraciones específicas de los servicios de Firebase.
*   `firestore.rules`: Reglas de seguridad para la base de datos.
*   `storage.rules`: Reglas de seguridad para el almacenamiento de archivos.

### `/docs`
Documentación del proyecto.
*   `ARQUITECTURA.md`: Detalles de la arquitectura técnica.
*   `MANUAL_USUARIO.md` / `MANUAL_INSTALACION.md`: Guías para usuarios y despliegue.

### `/diagramas`
Diagramas visuales del sistema (Mermaid).

### `/postman`
Colecciones para pruebas de API (Postman y Bruno).
