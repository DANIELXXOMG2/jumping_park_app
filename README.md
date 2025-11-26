# 🎢 Jumping Park - Sistema de Gestión de Consentimientos

Sistema de kiosko táctil para registro de visitantes y firma digital de consentimientos informados para parques de trampolines.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Admin-orange?logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwindcss)

## 📋 Características

- ✅ **Registro Express:** Captura de datos con teclado virtual y validación OTP
- ✅ **Firma Digital:** Canvas de firma con recorte automático para optimización
- ✅ **Consecutivos Atómicos (RF-08):** Generación segura mediante transacciones Firestore
- ✅ **PDF Automático:** Generación y envío por email con el consentimiento firmado
- ✅ **UX Táctil:** Diseñado para pantallas touch de kiosko

---

## 🏗️ Arquitectura

El proyecto sigue el **Service Layer Pattern** para separar responsabilidades:

```
src/
├── app/                      # Next.js App Router
│   ├── (kiosk)/              # Route Group - Experiencia Kiosko
│   │   ├── layout.tsx        # Layout compartido (header, fondo)
│   │   ├── page.tsx          # Home (/)
│   │   ├── ingreso/          # Paso 1: Identificación
│   │   ├── otp/              # Paso 2: Validación OTP
│   │   ├── registro/         # Paso 3: Datos personales
│   │   └── consentimiento/   # Paso 4: Firma y aceptación
│   ├── api/                  # API Routes
│   │   ├── usuarios/         # CRUD usuarios + check
│   │   ├── consentimientos/  # Crear consentimiento
│   │   ├── otp/              # Solicitar + validar OTP
│   │   └── [recursos]/       # CRUD genérico (accesos, facturas, etc.)
│   ├── layout.tsx            # Root Layout
│   └── globals.css           # Estilos globales + Tailwind
│
├── components/
│   └── kiosk/                # Componentes específicos del kiosko
│       ├── SignaturePad.tsx  # Canvas de firma digital
│       ├── VirtualKeypad.tsx # Teclado numérico táctil
│       └── OtpDisplay.tsx    # Input de código OTP
│
├── lib/                      # Utilidades y configuración
│   ├── firebaseAdmin.ts      # Singleton Firebase Admin SDK
│   ├── firestoreService.ts   # CRUD genérico tipado
│   ├── apiHandler.ts         # Wrapper de errores centralizado
│   ├── createCrudRoutes.ts   # Factory para rutas CRUD
│   ├── schemas/              # Esquemas Zod
│   │   ├── auth.schema.ts
│   │   ├── consent.schema.ts
│   │   ├── crud.schema.ts
│   │   └── visitor.schema.ts
│   └── utils/
│       └── formatters.ts     # Utilidades (maskEmail, formatCurrency, etc.)
│
├── services/                 # Lógica de negocio (Domain Layer)
│   ├── authService.ts        # Gestión de OTP y autenticación
│   ├── consentService.ts     # Orquestador de consentimientos (RF-08)
│   ├── emailService.ts       # Envío de emails (Resend)
│   └── pdfService.ts         # Generación de PDFs
│
├── store/
│   └── kioskStore.ts         # Estado global (Zustand)
│
└── types/
    └── firestore.ts          # Tipos de documentos Firestore
```

---

## 🔐 Flujo de Consecutivos Atómicos (RF-08)

La generación de IDs únicos de consentimiento usa **transacciones atómicas** de Firestore:

```typescript
// src/services/consentService.ts
private async generateConsecutivo(): Promise<number> {
  const counterRef = db.collection("_counters").doc("consents");

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    const currentValue = doc.exists ? doc.data()?.value ?? 1000 : 1000;
    const nextValue = currentValue + 1;
    
    transaction.set(counterRef, { value: nextValue, updatedAt: new Date() });
    return nextValue;
  });
}
```

**Garantías:**
- ❌ Sin colisiones bajo concurrencia
- ❌ Sin huecos en la secuencia
- ✅ Consecutivos: 1001, 1002, 1003...

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.0.3 |
| Lenguaje | TypeScript | 5.x (strict) |
| Estilos | Tailwind CSS | 4.x |
| Base de datos | Firebase Firestore | Admin SDK |
| Storage | Firebase Storage | Admin SDK |
| Email | Resend | API |
| Validación | Zod | 3.x |
| Estado | Zustand | 5.x |
| PDF | pdf-lib | 1.x |
| Toasts | Sonner | 2.x |
| Forms | react-hook-form | 7.x |

---

## 🚀 Instalación

### Prerrequisitos
- [Bun](https://bun.sh/) >= 1.0
- Cuenta de Firebase con Firestore y Storage habilitados
- Cuenta de [Resend](https://resend.com/) para emails

### Configuración

1. **Clonar e instalar:**
```bash
git clone <repo-url>
cd jumping_park_app
bun install
```

2. **Variables de entorno:**
```bash
cp .env.example .env
```

Configurar en `.env`:
```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
```

3. **Ejecutar en desarrollo:**
```bash
bun run dev
```

4. **Build de producción:**
```bash
bun run build
bun run start
```

---

## 📂 Colecciones Firestore

| Colección | Descripción |
|-----------|-------------|
| `users` | Perfiles de visitantes (uid = cédula) |
| `consents` | Consentimientos firmados |
| `otps` | Códigos OTP temporales |
| `minors` | Menores registrados |
| `accesses` | Registros de ingreso |
| `invoices` | Facturas |
| `services` | Servicios disponibles |
| `sales` | Ventas realizadas |
| `_counters` | Contadores atómicos internos |

---

## 🔒 Seguridad Firebase

- **Firestore:** Acceso bloqueado desde cliente. Todo pasa por API Routes con Admin SDK.
- **Storage:** Firmas digitales protegidas con URLs firmadas de larga duración.
- **OTPs:** Colección `otps` solo accesible vía servidor (TTL 10 min).

```bash
# Desplegar reglas
firebase deploy --only firestore:rules,storage:rules
```

---

## 🧪 Testing con API

Colección de Postman/Bruno disponible en `postman/`:

```bash
# Flujo completo del Kiosko:
1. POST /api/usuarios/check   # Verificar si usuario existe
2. POST /api/otp              # Solicitar código OTP
3. POST /api/otp/validate     # Validar código
4. POST /api/consentimientos  # Firmar consentimiento
```

---

## 📜 Scripts disponibles

```bash
bun dev        # Servidor de desarrollo (Turbopack)
bun build      # Build de producción
bun start      # Servir build de producción
bun lint       # ESLint
```

---

## 📜 Licencia

Proyecto privado - Jumping Park © 2025

---

## 👥 Contribuidores

Desarrollado con ❤️ para Jumping Park.
