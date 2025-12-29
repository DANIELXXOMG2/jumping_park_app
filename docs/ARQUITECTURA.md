# 🏗️ Arquitectura del Sistema

> Documento de decisiones arquitectónicas para **Jumping Park Consents App**

---

## 📋 Índice

1. [Modelo de Costos (Zero-Cost)](#1-modelo-de-costos-zero-cost)
2. [Patrón de Datos](#2-patrón-de-datos)
3. [Seguridad & RBAC](#3-seguridad--rbac)
4. [Optimización para Kiosco](#4-optimización-para-kiosco)
5. [Calidad de Código](#5-calidad-de-código)
6. [Stack Tecnológico](#6-stack-tecnológico)
7. [Gestión de Consentimiento (CMS)](#7-gestión-de-consentimiento-cms)

---

## 1. Modelo de Costos (Zero-Cost)

### 🎯 Objetivo

Minimizar costos operativos aprovechando los **Free Tiers** de los servicios utilizados.

### 📊 Estrategia de Lectura: Firestore + SWR

El mayor costo en Firestore proviene de las **lecturas**. Implementamos una estrategia de caché agresiva en cliente:

```
┌────────────────────────────────────────────────────────────────────┐
│                     FLUJO DE DATOS CON SWR                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [Usuario]  ──▶  [SWR Cache]  ──▶  [API Route]  ──▶  [Firestore]  │
│                      │                                             │
│                      ▼                                             │
│               Stale-While-Revalidate                              │
│               ┌─────────────────────┐                              │
│               │ • Muestra dato cache │                             │
│               │ • Revalida en fondo  │                             │
│               │ • Dedup 60 segundos  │                             │
│               └─────────────────────┘                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Implementación en `src/hooks/useConsents.ts`:**

```typescript
const { data, error, isLoading, isValidating, mutate } =
  useSWR<ConsentsResponse>(key, fetcher, {
    revalidateOnFocus: false,        // No revalidar al cambiar de pestaña
    dedupingInterval: 60000,         // 60s de deduplicación entre requests
    keepPreviousData: true,          // Mostrar datos previos mientras carga
  });
```

**Beneficios:**
- ⚡ **UX instantánea**: El usuario ve datos inmediatamente del caché
- 💰 **Menos lecturas**: Deduplicación evita requests duplicados
- 🔄 **Datos frescos**: Revalidación en segundo plano mantiene actualidad

### 📧 Emails Transaccionales: Resend Free Tier

| Servicio | Free Tier | Uso Estimado/Mes |
|----------|-----------|------------------|
| Resend   | 100 emails/día (3,000/mes) | ~500 emails |

**Tipos de emails enviados:**
1. **OTP de verificación**: Código de 6 dígitos para autenticación
2. **Confirmación de consentimiento**: PDF adjunto con firma

**Implementación en `src/services/emailService.ts`:**

```typescript
const resend = new Resend(process.env.RESEND_API_KEY);

// Remitente según entorno
const FROM_EMAIL = "Jumping Park <no-reply@jumpingpark.lat>";
const FROM_EMAIL_DEV = "Jumping Park <onboarding@resend.dev>";
```

### 💾 Resumen de Costos Mensuales

| Servicio | Tier | Límite Free | Costo Esperado |
|----------|------|-------------|----------------|
| Firestore | Spark | 50K lecturas/día | $0 |
| Firebase Auth | Free | Ilimitado | $0 |
| Resend | Free | 3K emails/mes | $0 |
| Vercel | Hobby | 100GB bandwidth | $0 |
| **Total** | | | **$0** |

---

## 2. Patrón de Datos

### 📚 Referencia Completa

Para el esquema detallado de colecciones y campos, consultar:
→ **[ARQUITECTURA_DATOS.md](./ARQUITECTURA_DATOS.md)** (si existe)

### 🗃️ Estrategia: Desnormalización para Lectura Rápida

Firestore favorece la **desnormalización** sobre las JOINs. Nuestro enfoque:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA DE CONSENTIMIENTO                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  consents/{consentId}                                               │
│  ├── consecutivo: 1234                                              │
│  ├── adultName: "Juan Pérez"      ◄── Desnormalizado del usuario   │
│  ├── adultEmail: "juan@email.com" ◄── Evita JOIN con users/        │
│  ├── adultPhone: "+57..."                                           │
│  ├── minorsCount: 2               ◄── Contador pre-calculado       │
│  ├── minors: [                    ◄── Array embebido (no subcolección) │
│  │     { fullName, birthDate, eps, ... },                          │
│  │     { fullName, birthDate, eps, ... }                           │
│  │   ]                                                              │
│  ├── signatureUrl: "gs://..."                                       │
│  └── createdAt, validUntil, ...                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Principios aplicados:**

| Principio | Aplicación | Beneficio |
|-----------|------------|-----------|
| **Embed arrays pequeños** | `minors[]` dentro de consent | Una sola lectura para todo |
| **Duplicar datos de lectura** | `adultName`, `adultEmail` | Sin JOINs costosos |
| **Contadores pre-calculados** | `minorsCount` | Evita `COUNT()` en queries |
| **IDs secuenciales** | `consecutivo` auto-incremental | Orden natural sin índice |

---

## 3. Seguridad & RBAC

### 🔐 Arquitectura de Autenticación

```
┌──────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Cliente]                    [Edge Middleware]         [API Routes] │
│      │                              │                        │       │
│      │ ──── Request /admin ────────▶│                        │       │
│      │                              │                        │       │
│      │                        ┌─────┴─────┐                  │       │
│      │                        │ proxy.ts  │                  │       │
│      │                        │ (headers) │                  │       │
│      │                        └─────┬─────┘                  │       │
│      │                              │                        │       │
│      │◀───── Página + AdminGuard ───│                        │       │
│      │                              │                        │       │
│  ┌───┴───┐                                               ┌───┴───┐   │
│  │Client │ ─── Firebase Auth Token ─────────────────────▶│Server │   │
│  │ Auth  │                                               │ SDK   │   │
│  └───────┘                                               └───────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 🛡️ Middleware de Protección (`src/proxy.ts`)

El middleware se ejecuta en **Edge Runtime** y aplica:

1. **Headers de seguridad** en todas las respuestas:
   ```typescript
   response.headers.set("X-Frame-Options", "DENY");
   response.headers.set("X-Content-Type-Options", "nosniff");
   response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
   ```

2. **Rutas públicas exceptuadas**:
   ```typescript
   const PUBLIC_ROUTES = ["/admin/login", "/admin/unauthorized"];
   ```

3. **Matcher configurado** para excluir assets estáticos:
   ```typescript
   export const config = {
     matcher: [
       "/((?!_next/static|_next/image|favicon.ico|assets|manifest.json|api).*)",
     ],
   };
   ```

> **Nota**: La verificación completa del rol se realiza en `AdminGuard` (cliente) ya que Edge Runtime no tiene acceso a Firebase Admin SDK.

### 👥 Sistema de Roles (RBAC)

**Roles disponibles:**

| Rol | Permisos | Descripción |
|-----|----------|-------------|
| `admin` | Lectura/Escritura completa | Acceso total al panel |
| `cashier` | Lectura de datos | Solo consultas, sin modificar |
| `visitor` | Sin acceso admin | Usuario regular del kiosco |

**Almacenamiento dual de roles:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALMACENAMIENTO DE ROLES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CUSTOM CLAIMS (Firebase Auth)                               │
│     └── { admin: true }                                         │
│     └── Verificación rápida en cliente vía getIdTokenResult()  │
│                                                                 │
│  2. FIRESTORE (admin_users/{uid})                               │
│     └── { role: "admin", email, displayName, ... }              │
│     └── Datos adicionales y auditoría                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Verificación en Firestore Rules:**

```javascript
function hasAdminRole() {
  return isAdmin() || (
    request.auth != null && 
    exists(/databases/$(database)/documents/admin_users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.role in ['admin', 'cashier']
  );
}
```

### 🔧 Script `set-admin-role.ts`

Asigna roles a usuarios existentes en Firebase Auth:

```bash
# Asignar rol admin
bun run set-admin admin@example.com

# Asignar rol cajero
bun run set-admin cajero@example.com cashier
```

**Acciones del script:**
1. Busca usuario en Firebase Auth por email
2. Crea/actualiza documento en `admin_users/{uid}`
3. Establece Custom Claim `{ admin: true }` (solo para rol admin)

---

## 4. Optimización para Kiosco

### 📦 Lazy Loading de Librerías Pesadas

El kiosco debe cargar rápido en tablets/dispositivos limitados. Estrategia:

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUNDLE SPLITTING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CARGA INICIAL (< 600KB)                                        │
│  ├── React + Next.js core                                       │
│  ├── UI Components (Tailwind)                                   │
│  └── Firebase Auth                                              │
│                                                                 │
│  LAZY LOADING (bajo demanda)                                    │
│  ├── tesseract.js (~4MB)     ──▶ Solo al escanear documento    │
│  ├── pdf-lib (~500KB)        ──▶ Solo al generar PDF           │
│  └── react-signature-canvas  ──▶ Solo al firmar               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementación en `src/hooks/useOCRScanner.ts`:**

```typescript
/**
 * Hook personalizado para escaneo OCR de documentos
 * Usa Tesseract.js con lazy loading del worker WASM
 */
export function useOCRScanner() {
  // Referencia al worker para reutilizarlo
  const workerRef = useRef<...>(null);

  const initializeWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;

    // Import dinámico para lazy loading
    const Tesseract = await import("tesseract.js");
    
    const worker = await Tesseract.createWorker("spa", undefined, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setState((prev) => ({ ...prev, progress: Math.round(m.progress * 100) }));
        }
      },
    });
    
    return worker;
  }, []);
}
```

**Beneficios:**
- 🚀 **First Load JS**: < 600KB (TTI < 3s en 3G)
- 📱 **Mejor UX móvil**: No bloquea la UI inicial
- 💾 **Menos memoria**: Workers se cargan solo cuando se necesitan

### 📴 Manejo Offline

**Página de fallback** (`src/app/offline/page.tsx`):

Cuando el usuario pierde conexión, mostramos una UI amigable:

```tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 ...">
      <WifiOff className="w-16 h-16 text-red-400" />
      <h1>Sin conexión a Internet</h1>
      <button onClick={() => window.location.reload()}>
        Recargar página
      </button>
    </div>
  );
}
```

**Caché de sesión en AdminGuard:**

```typescript
// Obtener rol cacheado de sessionStorage (sin estado React)
const getCachedRole = (): string | null => {
  return sessionStorage.getItem("adminRole");
};

// Si estamos offline y tenemos cache de rol válido, permitir acceso
if (!isOnline && cachedRole && canAccessAdmin(cachedRole)) {
  return; // Permitir acceso con datos cacheados
}
```

---

## 5. Calidad de Código

### ⚡ Biome vs ESLint

Elegimos **Biome** como linter y formatter por:

| Aspecto | ESLint + Prettier | Biome |
|---------|-------------------|-------|
| **Velocidad** | ~2-5s en proyecto medio | ~100ms |
| **Configuración** | Múltiples archivos | Un solo `biome.json` |
| **Dependencias** | 10+ packages | 1 package |
| **Lenguaje** | JavaScript (lento) | Rust (nativo) |

**Configuración actual (`biome.json`):**

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn",
        "useExhaustiveDependencies": "warn"
      }
    }
  },
  "formatter": {
    "enabled": false  // Usamos otro formatter o Prettier
  }
}
```

### 📁 Estructura Feature-Based

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Grupo de rutas admin
│   │   ├── layout.tsx
│   │   └── admin/
│   ├── (kiosk)/           # Grupo de rutas kiosco
│   │   ├── layout.tsx
│   │   ├── consentimiento/
│   │   └── registro/
│   └── api/               # API Routes
│
├── components/
│   ├── admin/             # Componentes exclusivos del admin
│   ├── kiosk/             # Componentes exclusivos del kiosco
│   └── ui/                # Componentes compartidos
│
├── hooks/                 # Hooks personalizados
├── services/              # Lógica de negocio (email, pdf)
├── lib/                   # Utilidades y configuración
│   ├── data/             # Datos estáticos (EPS, textos legales)
│   ├── schemas/          # Validación con Zod
│   └── utils/            # Funciones helper
│
└── store/                 # Estado global (Zustand)
```

**Principios:**

1. **Co-location**: Archivos relacionados cerca unos de otros
2. **Separación por feature**: `admin/` vs `kiosk/` claramente separados
3. **Barrel exports**: `hooks/index.ts` para imports limpios
4. **Schemas centralizados**: Validación Zod en `lib/schemas/`

---

## 6. Stack Tecnológico

### 🛠️ Dependencias Principales

| Categoría | Librería | Versión | Uso |
|-----------|----------|---------|-----|
| **Framework** | Next.js | 16.x | App Router + React 19 |
| **Estilos** | Tailwind CSS | 4.x | Utility-first CSS |
| **Estado** | Zustand | 5.x | Estado global del kiosco |
| **Data Fetching** | SWR | 2.x | Caché y revalidación |
| **Backend** | Firebase | 12.x | Auth + Firestore |
| **Email** | Resend | 6.x | Emails transaccionales |
| **PDF** | pdf-lib | 1.x | Generación de PDFs |
| **OCR** | Tesseract.js | 5.x | Escaneo de documentos |
| **Forms** | React Hook Form + Zod | - | Validación |
| **Linting** | Biome | 2.x | Linter ultra-rápido |

### 📈 Scripts Disponibles

```bash
# Desarrollo
bun run dev              # Servidor de desarrollo

# Build
bun run build            # Build de producción

# Calidad
bun run lint             # Linting con ESLint (fallback)
bun run audit:dead       # Detectar código muerto (Knip)
bun run audit:dupe       # Detectar código duplicado (JSCPD)

# Base de datos
bun run seed             # Poblar con datos de prueba
bun run set-admin        # Asignar rol de admin

# Assets
bun run optimize-assets  # Optimizar imágenes
```

---

## 📝 Notas Finales

### Decisiones Conscientes

1. **No usamos ORM**: Firestore Admin SDK es suficiente y evita abstracciones innecesarias
2. **No usamos Redux**: Zustand + SWR cubren todos los casos de estado
3. **Sin SSR agresivo**: El kiosco requiere interactividad inmediata (CSR preferido)
4. **PDF server-side**: `pdf-lib` genera PDFs en API Routes para incluir fuentes personalizadas

### Mejoras Futuras

- [ ] Implementar Service Worker completo para offline
- [ ] Migrar de Custom Claims a Firestore Rules puras
- [ ] Añadir rate limiting en API Routes
- [ ] Implementar audit log para acciones admin

---

## 7. Gestión de Consentimiento (CMS)

### 🌐 Arquitectura Políglota

El sistema de consentimiento soporta múltiples idiomas mediante una estructura de datos jerárquica:

```
┌─────────────────────────────────────────────────────────────────────┐
│              ESTRUCTURA MULTILENGUAJE EN FIRESTORE                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  settings/consent (documento único)                                 │
│  {                                                                  │
│    "es": {                        ◄── Idioma principal (obligatorio)│
│      "meta": { version, lastUpdated, companyName },                 │
│      "consent": { title, subtitle, clauses[], closingStatement },   │
│      "rules": { title, introduction, items[], closingMessage }      │
│    },                                                               │
│    "en": {                        ◄── Idiomas secundarios           │
│      "meta": { ... },                                               │
│      "consent": { ... },                                            │
│      "rules": { ... }                                               │
│    }                                                                │
│  }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Tipos TypeScript (`lib/data/legalContent.ts`):**

```typescript
// Estructura para UN idioma
interface ConsentContentStructure {
  meta: { version, lastUpdated, companyName };
  consent: { title, subtitle, introduction, clauses[], closingStatement };
  rules: { title, introduction, items[], closingMessage };
}

// Estructura multilenguaje completa
type MultiLanguageContent = {
  es: ConsentContentStructure;
  en: ConsentContentStructure;
};
```

### 🤖 Traducción Automática con IA (Gemini)

El panel de administración incluye traducción automática usando Google Gemini:

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUJO DE TRADUCCIÓN CON IA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Admin UI]                                                     │
│      │                                                          │
│      ├── 1. Usuario edita contenido en Español (es)             │
│      │                                                          │
│      ├── 2. Cambia a pestaña "English"                          │
│      │                                                          │
│      ├── 3. Click "✨ Traducir desde Español con IA"            │
│      │                                                          │
│      ▼                                                          │
│  [Server Action: translateConsentToEnglish]                     │
│      │                                                          │
│      ├── Valida GOOGLE_API_KEY                                  │
│      │                                                          │
│      ├── Envía JSON español a Gemini 1.5 Flash                  │
│      │   └── Prompt: "Traduce SOLO text, title, content..."     │
│      │                                                          │
│      ├── Preserva: IDs, claves, placeholders {COMPANY_NAME}     │
│      │                                                          │
│      ▼                                                          │
│  [Respuesta JSON traducida]                                     │
│      │                                                          │
│      └── 4. UI actualiza estado de pestaña "en"                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Server Action (`app/actions/translate-consent.ts`):**

```typescript
"use server";

export async function translateConsentToEnglish(
  spanishContent: ConsentContentStructure
): Promise<TranslateConsentResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Baja temperatura para consistencia
    },
  });
  
  // Prompt estricto para traducciones legales
  const result = await model.generateContent([SYSTEM_PROMPT, userPrompt]);
  return { success: true, data: parsedResponse };
}
```

### 🔐 Variables de Entorno Requeridas

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `GOOGLE_API_KEY` | API Key de Google AI Studio para Gemini | Sí (para traducción IA) |

**Obtener API Key:**
1. Ir a [Google AI Studio](https://aistudio.google.com/)
2. Crear proyecto o seleccionar existente
3. Generar API Key
4. Agregar a `.env.local`: `GOOGLE_API_KEY=tu_api_key`

### ✅ Validación de Datos

La validación usa **Zod** y está en `lib/schemas/legalContent.schema.ts`:

```typescript
// Valida ESTRUCTURA, no CANTIDAD de elementos
export const localizedConsentSchema = z.object({
  meta: consentMetaSchema,
  consent: consentSectionSchema,
  rules: rulesSectionSchema,
});

// Documento multilenguaje
export const consentContentStructureSchema = z.record(
  z.string().min(2).max(5), // Claves ISO 639-1
  localizedConsentSchema
);
```

**Características:**
- ✅ El admin puede agregar/eliminar cláusulas libremente
- ✅ No hay validación de cantidad mínima/máxima de reglas
- ✅ Solo se rechaza si la estructura está corrupta (campos faltantes)
- ✅ Validación por idioma independiente

---

*Última actualización: Diciembre 2024*
