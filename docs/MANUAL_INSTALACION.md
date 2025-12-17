# 🚀 Manual de Instalación y Despliegue

Guía paso a paso para desplegar **Jumping Park** en producción usando **Vercel** + **Firebase**.

---

## 📋 Tabla de Contenidos

1. [Firebase Setup](#1-firebase-setup)
2. [Variables de Entorno en Vercel](#2-variables-de-entorno-en-vercel)
3. [Primer Despliegue](#3-primer-despliegue)
4. [Post-Instalación](#4-post-instalación)

---

## 1. Firebase Setup

### 1.1 Crear Proyecto

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en **"Agregar proyecto"**
3. Nombre sugerido: `jumping-park-consents`
4. Desactiva Google Analytics (opcional para Free Tier)
5. Click en **"Crear proyecto"**

### 1.2 Habilitar Autenticación

1. En el menú lateral: **Build > Authentication**
2. Click en **"Comenzar"**
3. Pestaña **"Sign-in method"** → Habilitar **Google**
4. Configura el correo de soporte y guarda

### 1.3 Configurar Firestore Database

1. En el menú lateral: **Build > Firestore Database**
2. Click en **"Crear base de datos"**
3. Selecciona **"Modo de producción"**
4. Elige la región más cercana (ej: `us-east1` o `southamerica-east1`)
5. Click en **"Habilitar"**

### 1.4 Configurar Índices

Crea el archivo `firestore.indexes.json` en la raíz del proyecto (si no existe):

```json
{
  "indexes": [
    {
      "collectionGroup": "consents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "accesses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "entryTime", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "otp_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Despliega los índices:

```bash
firebase deploy --only firestore:indexes
```

### 1.5 Configurar Reglas de Seguridad

En **Firestore Database > Reglas**, reemplaza el contenido con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // =========================================================================
    // FUNCIONES HELPER
    // =========================================================================
    
    // Verifica si el usuario es admin (via custom claim)
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Verifica si el usuario tiene rol admin o cashier en admin_users
    function hasAdminRole() {
      return isAdmin() || (
        request.auth != null && 
        exists(/databases/$(database)/documents/admin_users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role in ['admin', 'cashier']
      );
    }
    
    // Verifica si el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // =========================================================================
    // COLECCIÓN: admin_users (RBAC)
    // =========================================================================
    match /admin_users/{userId} {
      allow read: if hasAdminRole();
      allow write: if false;
    }
    
    // =========================================================================
    // COLECCIÓN: users
    // =========================================================================
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || hasAdminRole());
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    // =========================================================================
    // COLECCIÓN: otp_sessions (Solo server-side via Admin SDK)
    // =========================================================================
    match /otp_sessions/{documentId} {
      allow read, write: if false;
    }

    // =========================================================================
    // COLECCIÓN: consents
    // =========================================================================
    match /consents/{consentId} {
      allow read: if isAuthenticated() && (request.auth.uid == resource.data.userId || hasAdminRole());
      allow write: if false;
    }
    
    // =========================================================================
    // COLECCIÓN: accesses
    // =========================================================================
    match /accesses/{accessId} {
      allow read, write: if hasAdminRole();
    }

    // =========================================================================
    // DEFAULT: Denegar todo lo demás
    // =========================================================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Publica las reglas:

```bash
firebase deploy --only firestore:rules
```

### 1.6 Obtener Credenciales del Service Account

1. Ve a **Project Settings** (⚙️) > **Service Accounts**
2. Click en **"Generar nueva clave privada"**
3. Descarga el archivo JSON
4. Extrae los valores necesarios:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 1.7 Obtener Credenciales del Client SDK

1. Ve a **Project Settings** (⚙️) > **General**
2. En "Tus apps", click en el icono web (`</>`)
3. Registra la app (nombre: `jumping-park-web`)
4. Copia los valores de `firebaseConfig`:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## 2. Variables de Entorno en Vercel

En el dashboard de Vercel, ve a **Settings > Environment Variables** y configura:

### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | `jumping-park-consents` |
| `FIREBASE_CLIENT_EMAIL` | Email del Service Account | `firebase-adminsdk-xxx@proyecto.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Clave privada (con `\n` escapados) | `-----BEGIN PRIVATE KEY-----\nMIIE...` |
| `FIREBASE_STORAGE_BUCKET` | Bucket de Storage | `proyecto.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key pública | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de Auth | `proyecto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto (público) | `jumping-park-consents` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket (público) | `proyecto.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `1234567890` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:123456:web:abc123` |
| `RESEND_API_KEY` | API Key de Resend | `re_XXXXX...` |
| `ADMIN_SECRET_KEY` | Clave secreta para scripts admin | `tu-clave-secreta-segura` |

### ⚠️ Nota sobre FIREBASE_PRIVATE_KEY

La clave privada debe mantener los saltos de línea. En Vercel:

1. Copia la clave completa del JSON incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
2. Pégala tal cual (Vercel maneja los `\n` automáticamente)
3. **NO** la envuelvas en comillas adicionales

---

## 3. Primer Despliegue

### 3.1 Conectar Repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New Project"**
3. Importa el repositorio de GitHub: `jumping_park_app`
4. Configura el proyecto:

| Opción | Valor |
|--------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `./` |
| **Build Command** | `bun run build` |
| **Output Directory** | `.next` |
| **Install Command** | `bun install` |

5. Agrega todas las **Environment Variables** (ver sección anterior)
6. Click en **"Deploy"**

### 3.2 Configurar Dominio (Opcional)

1. En **Settings > Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel

---

## 4. Post-Instalación

### 4.1 Ejecutar Script de Seed (Datos Iniciales)

Desde tu máquina local, con las variables de entorno apuntando a producción:

```bash
# Asegúrate de tener .env.local con credenciales de producción
bun run seed
```

Este script crea:
- Configuración inicial del sistema
- Datos de ejemplo (EPS, tipos de documento, etc.)

### 4.2 Crear Primer Administrador

```bash
# Sintaxis: bun run set-admin <email> <rol>
bun run set-admin admin@tudominio.com admin
```

**Roles disponibles:**
- `admin` - Acceso completo al panel administrativo
- `cashier` - Acceso limitado (solo registro de accesos)

### 4.3 Verificar Despliegue

1. Accede a `https://tu-dominio.vercel.app`
2. Verifica que el kiosko carga correctamente
3. Accede a `https://tu-dominio.vercel.app/admin`
4. Inicia sesión con Google usando el correo configurado como admin

---

## 🔧 Troubleshooting

### Error: "FIREBASE_PRIVATE_KEY not found"

- Verifica que la clave está correctamente configurada en Vercel
- Asegúrate de no tener comillas extras envolviendo la clave

### Error: "Permission denied" en Firestore

- Verifica que las reglas están desplegadas: `firebase deploy --only firestore:rules`
- Confirma que el usuario tiene el rol correcto en `admin_users`

### El admin no puede acceder al panel

1. Verifica que el script `set-admin` se ejecutó correctamente
2. Confirma que el email coincide exactamente con la cuenta de Google
3. Revisa la colección `admin_users` en Firebase Console

---

## 📚 Referencias

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Arquitectura del Sistema](./ARQUITECTURA.md)
- [Modelo de Datos](./ARQUITECTURA_DATOS.md)
