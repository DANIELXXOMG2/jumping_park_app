<div align="center">

# 🎢 Jumping Park

### Sistema de Gestión de Consentimientos Digitales

**Plataforma de kiosko táctil para registro de visitantes y firma digital de consentimientos informados**

[![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Bun](https://img.shields.io/badge/Bun-1.x-F9F1E1?logo=bun&logoColor=black)](https://bun.sh/)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

</div>

---

## 📑 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Comandos Disponibles](#-comandos-disponibles)
- [Layout del Repositorio](#-layout-del-repositorio)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Despliegue en Vercel](#-despliegue-en-vercel)
- [Colecciones Firestore](#-colecciones-firestore)
- [Seguridad](#-seguridad)
- [Testing de API](#-testing-de-api)
- [Documentación Adicional](#-documentación-adicional)

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Framework** | Next.js (App Router) | 16.0.7 | SSR, API Routes, Routing |
| **Lenguaje** | TypeScript | 5.9+ | Tipado estático estricto |
| **Estilos** | Tailwind CSS | 4.1 | Utility-first CSS |
| **Base de Datos** | Firebase Firestore | Admin SDK | NoSQL, tiempo real |
| **Storage** | Firebase Storage | Admin SDK | Almacenamiento de firmas |
| **Email** | Resend | 6.x | Emails transaccionales (OTP, PDF) |
| **Validación** | Zod | 4.x | Schema validation |
| **Estado Global** | Zustand | 5.x | Client-side state |
| **Generación PDF** | pdf-lib | 1.17 | Consentimientos firmados |
| **Formularios** | react-hook-form | 7.x | Gestión de forms |
| **Animaciones** | Framer Motion | 12.x | UI animations |
| **Notificaciones** | Sonner | 2.x | Toast notifications |

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

| Requisito | Versión Mínima | Instalación |
|-----------|----------------|-------------|
| **Node.js** | 20.0+ | [nodejs.org](https://nodejs.org/) |
| **Bun** | 1.0+ | `curl -fsSL https://bun.sh/install \| bash` |
| **Git** | 2.x | [git-scm.com](https://git-scm.com/) |

### Cuentas de Servicios Requeridas

1. **Firebase** (Free Tier - Spark Plan)
   - Proyecto con Firestore Database habilitado
   - Firebase Storage habilitado
   - Service Account con permisos de Admin

2. **Resend** (Free Tier - 100 emails/día)
   - Cuenta activa en [resend.com](https://resend.com)
   - Dominio verificado (o usar dominio de prueba)

3. **Vercel** (Free Tier - Hobby Plan) *[Opcional para deploy]*
   - Cuenta en [vercel.com](https://vercel.com)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/DANIELXXOMG2/jumping_park_app.git
cd jumping_park_app
```

### 2. Instalar Dependencias

```bash
bun install
```

> ⚠️ **Importante:** Este proyecto usa exclusivamente `bun`. No usar `npm install` ni `pnpm install`.

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales (ver sección siguiente).

### 4. Configurar Firebase

```bash
# Desplegar reglas de Firestore y Storage
firebase deploy --only firestore:rules,storage:rules
```

### 5. Iniciar Servidor de Desarrollo

```bash
bun dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🔐 Variables de Entorno

Copia `.env.example` a `.env.local` y úsalo como contrato fuente de verdad:

```env
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-firebase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ADMIN_JWT_SECRET=una-clave-secreta-larga-y-aleatoria-min-32-chars
ADMIN_SESSION_MODE=dual
ADMIN_IDLE_TIMEOUT_MINUTES=30
OTP_LOCKOUT_MINUTES=15
OTP_HARDENING_ENABLED=true
EXPORT_BOUNDS_ENFORCED=true
PUBLIC_SEO_ENABLED=false
ALLOW_ADMIN_SETUP=false
ADMIN_SECRET_KEY=
FIREBASE_SERVICE_ACCOUNT_KEY=
FIRESTORE_EMULATOR_HOST=
ANALYZE=false
```

### Notas sobre Variables de Entorno

| Variable | Descripción | Dónde Obtenerla |
|----------|-------------|-----------------|
| `FIREBASE_PRIVATE_KEY` | Clave privada del Service Account. **Incluir saltos de línea como `\n`** | Firebase Console > Service Accounts > Generate Key |
| `NEXT_PUBLIC_FIREBASE_*` | Configuración pública del Client SDK/Auth web (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) | Firebase Console > Project Settings > Your apps |
| `RESEND_API_KEY` | API Key de Resend. Comienza con `re_` | [resend.com/api-keys](https://resend.com/api-keys) |
| `ADMIN_JWT_SECRET` | Secreto para firmar tokens JWT | Generar string aleatorio de 32+ caracteres |
| `ADMIN_SESSION_MODE` | Mantener `dual` durante el rollout de sesión cookie-first | Configuración local/Vercel |
| `OTP_HARDENING_ENABLED` | Activa o desactiva el enforcement estricto de OTP; dejar `true` salvo rollback controlado | `.env.local` / Vercel |
| `EXPORT_BOUNDS_ENFORCED` | Mantiene el rechazo de exports sin rango o mayores a 30 días | `.env.local` / Vercel |
| `PUBLIC_SEO_ENABLED` | Expone `robots.txt`, `sitemap.xml` y metadata indexable para la superficie pública | `.env.local` / Vercel |

### Semántica de rollout de flags

- Local/dev: cambiar `OTP_HARDENING_ENABLED`, `EXPORT_BOUNDS_ENFORCED` o `PUBLIC_SEO_ENABLED` requiere reiniciar `bun dev`.
- Preview/producción en Vercel: actualizar variables de entorno requiere un nuevo deploy para que rutas y metadata server-side tomen el cambio.
- Defaults recomendados: `OTP_HARDENING_ENABLED=true`, `EXPORT_BOUNDS_ENFORCED=true`, `PUBLIC_SEO_ENABLED=false` hasta completar humo SEO.

---

## 📜 Comandos Disponibles

```bash
bun dev                 # Inicia servidor de desarrollo (Turbopack) - http://localhost:3000
bun run check           # Gate principal: format + lint + types + audit
bun run check:types     # Verificación rápida de TypeScript
bun test                # Suite de pruebas con Bun
bun run check:format    # Formato con Biome
bun run check:lint      # Lint con Biome
bun run audit:dead      # Detecta código muerto con Knip
bun run audit:dupe      # Detecta código duplicado con jscpd
bun run audit:circ      # Detecta dependencias circulares
bun run seed            # Pobla Firestore con datos de prueba
bun run set-admin       # Asigna rol admin a un usuario
bun run migrate:minors  # Migra menores al índice denormalizado
firebase deploy --only firestore:rules    # Despliega reglas de Firestore
firebase deploy --only storage:rules      # Despliega reglas de Storage
```

---

## 🗂️ Layout del Repositorio

| Categoría | Rutas | Uso |
|-----------|-------|-----|
| **Runtime-critical** | `src/`, `public/`, `tests/`, `package.json`, `next.config.ts`, `firebase.json`, `tsconfig.json` | Código, assets, pruebas y configuración que afectan el runtime o la validación principal |
| **Workflow / automation** | `.github/`, `openspec/`, `.claude/`, `.atl/`, `scripts/` | CI, especificaciones, automatización y tooling de ingeniería |
| **Support / reference** | `docs/`, `diagramas/`, `postman/` | Runbooks, documentación, diagramas y colecciones operativas |

### Artefactos locales no fuente

No versionar ni tratar como fuente de verdad artefactos generados del workspace como `.next/`, `.playwright-mcp/`, `node_modules/`, logs locales o salidas temporales de pruebas.

---

## 🏗️ Arquitectura del Proyecto

El proyecto implementa el **Service Layer Pattern** para separar responsabilidades:

```
src/
├── app/                          # Next.js App Router
│   ├── (kiosk)/                  # 🎪 Route Group - Experiencia Kiosko
│   │   ├── layout.tsx            # Layout compartido
│   │   ├── page.tsx              # Landing principal (/)
│   │   ├── ingreso/              # Paso 1: Identificación (cédula)
│   │   ├── otp/                  # Paso 2: Validación OTP
│   │   ├── registro/             # Paso 3: Datos personales
│   │   └── consentimiento/       # Paso 4: Firma digital
│   │
│   ├── (admin)/                  # 🔐 Route Group - Panel Administrativo
│   │   ├── admin/login/          # Login administrador
│   │   └── admin/(protected)/    # Rutas protegidas
│   │       ├── page.tsx          # Dashboard principal
│   │       ├── usuarios/         # Gestión de usuarios
│   │       ├── consentimientos/  # Gestión de consentimientos
│   │       ├── menores/          # Gestión de menores
│   │       └── configuracion/    # Configuración del sistema
│   │
│   ├── api/                      # 🌐 API Routes (Backend)
│   │   ├── usuarios/             # CRUD usuarios + verificación
│   │   ├── consentimientos/      # Crear/listar consentimientos
│   │   ├── otp/                  # Solicitar/validar OTP
│   │   ├── menores/              # CRUD menores
│   │   ├── accesos/              # Registro de ingresos
│   │   └── admin/                # Endpoints administrativos
│   │
│   ├── layout.tsx                # Root Layout
│   └── globals.css               # Estilos globales + Tailwind
│
├── components/
│   ├── kiosk/                    # Componentes del Kiosko
│   │   ├── SignaturePad.tsx      # Canvas de firma digital
│   │   ├── VirtualKeypad.tsx     # Teclado numérico táctil
│   │   ├── OtpDisplay.tsx        # Input código OTP
│   │   └── MinorsSection.tsx     # Gestión de menores
│   ├── admin/                    # Componentes del Admin
│   └── ui/                       # Componentes UI base
│
├── services/                     # 📦 Capa de Negocio (Domain Layer)
│   ├── authService.ts            # Gestión de OTP y autenticación
│   ├── consentService.ts         # Orquestador de consentimientos
│   ├── emailService.ts           # Envío de emails (Resend)
│   └── pdfService.ts             # Generación de PDFs
│
├── lib/                          # ⚙️ Utilidades y Configuración
│   ├── firebaseAdmin.ts          # Singleton Firebase Admin SDK
│   ├── firebaseClient.ts         # Firebase Client SDK
│   ├── firestoreService.ts       # CRUD genérico tipado
│   ├── apiHandler.ts             # Wrapper de errores centralizado
│   ├── schemas/                  # Esquemas Zod
│   └── utils/                    # Utilidades (formatters, etc.)
│
├── store/
│   └── kioskStore.ts             # Estado global (Zustand)
│
├── contexts/
│   └── AuthContext.tsx           # Contexto de autenticación admin
│
└── types/
    └── firestore.ts              # Tipos de documentos Firestore
```

---

## ☁️ Despliegue en Vercel

### Opción 1: Deploy con CLI (Recomendado)

```bash
# 1. Instalar Vercel CLI
bun add -g vercel

# 2. Login en Vercel
vercel login

# 3. Deploy (seguir el wizard interactivo)
vercel

# 4. Deploy a producción
vercel --prod
```

### Opción 2: Deploy desde GitHub

1. **Conectar repositorio:**
   - Ve a [vercel.com/new](https://vercel.com/new)
   - Selecciona "Import Git Repository"
   - Autoriza acceso a GitHub y selecciona `jumping_park_app`

2. **Configurar proyecto:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `bun run build`
   - **Install Command:** `bun install`

3. **Configurar variables de entorno:**
   - Ve a Project Settings > Environment Variables
   - Agrega **todas** las variables de `.env.local`
   - ⚠️ Para `FIREBASE_PRIVATE_KEY`: pega la clave completa (Vercel maneja los saltos de línea)

4. **Deploy:**
   - Click en "Deploy"
   - Vercel ejecutará el build y desplegará automáticamente

### Configuración Post-Deploy

1. **Configurar dominio personalizado** (opcional):
   - Project Settings > Domains > Add Domain

2. **Configurar Resend para producción:**
   - Verifica tu dominio en Resend
   - Actualiza `RESEND_API_KEY` si es necesario

3. **Actualizar reglas de Firebase:**
   - Asegúrate de que el dominio de Vercel esté permitido en Firebase Console

---

## 📂 Colecciones Firestore

| Colección | Documento ID | Descripción |
|-----------|--------------|-------------|
| `users` | `{cédula}` | Perfiles de visitantes adultos |
| `consents` | `{autoID}` | Consentimientos firmados |
| `otp_challenges` | `{email}` | Estado pendiente del OTP: código, expiración, reintentos y lockout |
| `otp_access_sessions` | `{cédula}` | Sesión validada del kiosco con vigencia corta |
| `otp_sessions` | `{email}` o `{cédula}` | Compatibilidad transitoria con registros legacy; no es la colección canónica |
| `minors_index` | `{idNumber}` | Índice denormalizado de menores para búsquedas eficientes |
| `accesses` | `{autoID}` | Registros de ingreso al parque |
| `_counters` | `consents` | Contador atómico de consecutivos |

### Estructura de Documentos Principales

```typescript
// users/{cédula}
interface User {
  uid: string;           // Cédula
  fullName: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// consents/{autoID}
interface Consent {
  consecutivo: number;   // Ej: 1001, 1002...
  userId: string;        // Referencia a users
  signaturePath: string; // Ruta persistida en Firebase Storage
  signatureUrl?: string; // URL firmada efímera (compatibilidad/respuesta)
  minorsSnapshot: Minor[];
  createdAt: Timestamp;
  // NOTA: El PDF se genera bajo demanda via /api/admin/consents/{id}/pdf
}
```

---

## 🔒 Seguridad

### Principios Implementados

| Capa | Medida | Descripción |
|------|--------|-------------|
| **API** | Validación Zod | Todo input es validado antes de procesar |
| **Firestore** | Admin SDK Only | No hay acceso directo desde cliente |
| **Storage** | Referencias persistidas + URLs efímeras | Las firmas guardan `signaturePath` y se firman bajo demanda con expiración `<=15 min` |
| **OTP** | Split model + TTL | `otp_challenges` gestiona el challenge y `otp_access_sessions` la sesión validada; `otp_sessions` queda solo como legado |
| **Admin** | JWT + HttpOnly | Sesiones seguras con cookies |

### Reglas de Firestore

```javascript
// firebase/firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bloquear todo acceso directo - Solo Admin SDK
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🧪 Testing de API

Colección de Bruno/Postman disponible en `postman/`:

### Flujo Completo del Kiosko

```bash
# 1. Verificar si usuario existe
POST /api/usuarios/check
Body: { "cedula": "1234567890" }

# 2. Solicitar código OTP
POST /api/otp
Body: { "cedula": "1234567890" }

# 3. Validar código OTP
POST /api/otp/validate
Body: { "cedula": "1234567890", "code": "123456" }

# 4. Crear consentimiento
POST /api/consentimientos
Body: { 
  "visitorId": "1234567890",
  "signature": "data:image/png;base64,...",
  "minorIds": ["minor-id-1", "minor-id-2"]
}
```

---

## 📚 Documentación Adicional

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Manual de Usuario | `docs/MANUAL_USUARIO.md` | Guía para Cajeros y Visitantes |
| OTP Operational Policy | `docs/runbooks/otp-operational-policy.md` | Runbook operativo del ciclo OTP, límites, lockout y troubleshooting |
| Production Hardening Smoke Pack | `docs/runbooks/production-hardening.md` | Checklist reproducible de sesiones admin, abuso OTP, export bounds y robots/sitemap |
| Diagrama ER | `diagramas/Diagrama-de-Entidad-Relación.mmd` | Modelo de datos |
| Diagrama de Secuencia | `diagramas/Diagrama-Secuencia.mmd` | Flujo del sistema |
| Colección API | `postman/` | Tests de endpoints |

---

## 📜 Licencia

Este es un proyecto privado. Todos los derechos reservados.

**Jumping Park © 2025**

---

<div align="center">

Desarrollado con ❤️ para **Jumping Park**

[Reportar Bug](https://github.com/DANIELXXOMG2/jumping_park_app/issues) · [Solicitar Feature](https://github.com/DANIELXXOMG2/jumping_park_app/issues)

</div>
