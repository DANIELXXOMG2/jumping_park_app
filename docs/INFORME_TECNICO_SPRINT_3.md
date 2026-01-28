# 📊 Informe de Estado Técnico y Hoja de Ruta
## Jumping Park App — Sprint 3.0 (Performance & Optimization)

> **Fecha:** 28 de enero de 2026  
> **Autor:** DevTwin Architect (CTO)  
> **Estado:** Revisión Post-Refactorización

---

## 📋 Resumen Ejecutivo

| Área | Estado | Valoración |
|------|--------|------------|
| **Calidad de Código** | ✅ Óptimo | A+ |
| **Arquitectura de Software** | ✅ Sólida | A |
| **Infraestructura/Costos** | 🔴 Crítico | D |
| **Production Ready** | ⚠️ **NO** | - |

**Veredicto:** El código está en excelente forma, pero la infraestructura consume ~86% de la cuota gratuita diaria de Firestore. **Sin optimización, el proyecto incurrirá en costos en 2-3 semanas** o fallará por límite de cuota.

---

## 1. 🏛️ Veredicto de Arquitectura de Software

### ✅ Fortalezas Confirmadas (Sprint 2.3)

| Métrica | Antes | Ahora | Estado |
|---------|-------|-------|--------|
| Errores de Linter | - | 0 | ✅ |
| Ciclos de Dependencia | - | 0 | ✅ |
| Duplicación de Código | 5.5% | 1.85% | ✅ |
| Tipado | Mixto | Estricto | ✅ |

### Capas Implementadas Correctamente

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Route Handlers] ─────▶ [api-middleware.ts] ◄── Auth + Validación
│         │                                                       │
│         ▼                                                       │
│  [Services Layer] ─────▶ userService, consentService, etc.      │
│         │                                                       │
│         ▼                                                       │
│  [Data Access] ────────▶ firestoreService.ts                    │
│                                                                 │
│  [Frontend Hooks] ─────▶ useConsents (SWR), useConsentsTable    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🎯 ¿Listos para escalar features nuevas?

**SÍ, con condiciones:**
- ✅ La arquitectura de código soporta nuevas funcionalidades
- ✅ Los patrones de servicios y hooks están bien definidos
- ⚠️ **PERO** cada feature nueva aumentará las lecturas de Firestore
- ❌ **NO ESCALAR** hasta resolver el problema de 43k lecturas

---

## 2. 🔥 Diagnóstico de Infraestructura

### El Problema: 43,198 Lecturas Diarias

| Métrica | Valor | Límite Free | % Uso |
|---------|-------|-------------|-------|
| Documentos Totales | 1,424 | ∞ | - |
| Lecturas/Día | 43,198 | 50,000 | **86.4%** |
| Ratio Lectura/Doc | ~30x | <5x ideal | ❌ |

### 🔍 Fuentes de la Fuga de Lecturas (Análisis del Código)

#### 🚨 Problema #1: `useOfflineData.ts` — Listener Realtime Innecesario

```typescript
// src/hooks/useOfflineData.ts:179
unsubscribe = onSnapshot(
  usersQuery,
  { includeMetadataChanges: true },
  (snapshot) => { ... }
);
```

**Impacto Estimado:** `~15,000-20,000 lecturas/día`

- Se activa en **CADA** componente que usa `NetworkStatus`
- El `NetworkStatus` está en el Header del Admin (todas las páginas)
- `onSnapshot` = conexión WebSocket permanente que cuenta lecturas
- Lee **TODOS** los usuarios de los últimos 3 días en cada mount

#### 🚨 Problema #2: Dashboard Polling cada 30 segundos

```typescript
// src/app/(admin)/admin/(protected)/page.tsx:99
const interval = setInterval(() => fetchActivity(), 30000);
```

**Impacto Estimado:** `~8,000-12,000 lecturas/día`

Cálculo:
- `/api/admin/activity` hace **2 queries** a Firestore:
  1. `consents.where("signedAt", ">=", todayStart)` (~N docs)
  2. `consents.orderBy("signedAt").limit(10)` (10 docs)
- Si N = 50 consentimientos/día promedio
- Polling cada 30s = **2,880 llamadas/día**
- (50 + 10) × 2,880 = **172,800 lecturas teóricas** (si no hubiera caché)
- Con cache del servidor: ~8,000-12,000 reales

#### 🚨 Problema #3: SWR sin `revalidateOnFocus: false` global

```typescript
// src/hooks/useConsents.ts
useSWR(key, fetcher, {
  revalidateOnFocus: false,  // ✅ Bien aquí
  dedupingInterval: 60000,   // ✅ 60s
});
```

Aunque `useConsents` está bien configurado, **otros fetches directos con `adminGet`** no tienen protección de caché.

#### 🚨 Problema #4: `StaffManager` sin caché

```typescript
// src/components/admin/settings/StaffManager.tsx:94
useEffect(() => {
  fetchStaff();  // Fetch directo sin SWR ni caché
}, [fetchStaff]);
```

Cada visita a Configuración → Permisos hace una lectura completa de usuarios con roles.

---

## 3. 📋 Plan de Acción: Sprint 3.0

### Objetivo: Reducir de 43k a <5k lecturas/día

---

### Tarea 3.0.1: Eliminar `onSnapshot` del NetworkStatus

**Prioridad:** 🔴 CRÍTICA  
**Impacto:** -15,000 lecturas/día  
**Esfuerzo:** 2 horas

**Solución:**
```typescript
// ANTES (useOfflineData.ts)
onSnapshot(usersQuery, ...) // ❌ Realtime innecesario

// DESPUÉS
// El NetworkStatus solo necesita navigator.onLine
// La verificación de "fromCache" puede hacerse en hooks específicos
export function useOfflineConnection(): ConnectionState {
  // Solo eventos del navegador, SIN Firestore
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // ...
}

// Eliminar useRecentRegistrations del NetworkStatus
// Solo usarlo donde REALMENTE se necesiten datos de usuarios recientes
```

**Archivo a modificar:** [src/components/admin/NetworkStatus.tsx](src/components/admin/NetworkStatus.tsx)

---

### Tarea 3.0.2: Reemplazar Polling por Caché Inteligente

**Prioridad:** 🔴 CRÍTICA  
**Impacto:** -10,000 lecturas/día  
**Esfuerzo:** 3 horas

**Solución:**

1. **Crear hook con SWR para Activity:**

```typescript
// src/hooks/useActivity.ts (NUEVO)
import useSWR from "swr";
import { adminGet } from "@/lib/adminApi";

export function useActivity() {
  return useSWR("admin/activity", () => adminGet("/api/admin/activity"), {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60 * 1000, // 5 minutos (no 30 segundos!)
    dedupingInterval: 60000,
  });
}
```

2. **Actualizar Dashboard:**

```typescript
// src/app/(admin)/admin/(protected)/page.tsx
// ELIMINAR el setInterval
// USAR el nuevo hook con refresh manual
```

---

### Tarea 3.0.3: Configurar SWR Global con Proveedor

**Prioridad:** 🟡 ALTA  
**Impacto:** -5,000 lecturas/día  
**Esfuerzo:** 2 horas

**Solución:**

```typescript
// src/app/(admin)/layout.tsx
import { SWRConfig } from "swr";

export default function AdminLayout({ children }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000,
        errorRetryCount: 3,
        focusThrottleInterval: 120000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

---

### Tarea 3.0.4: Implementar Firestore Persistence (Offline-First)

**Prioridad:** 🟡 ALTA  
**Impacto:** -5,000 lecturas/día + mejor UX offline  
**Esfuerzo:** 4 horas

**Solución:**

```typescript
// src/lib/firebaseClient.ts
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({
      forceOwnership: true,
    }),
  }),
});
```

**Nota:** Esto permite que Firestore sirva datos desde IndexedDB sin ir al servidor.

---

### Tarea 3.0.5 (Opcional): Migrar a Server Components donde sea posible

**Prioridad:** 🟢 MEDIA  
**Impacto:** -3,000 lecturas/día  
**Esfuerzo:** 8 horas

Convertir páginas que no requieren interactividad en Server Components con `cache()`:

```typescript
// src/app/(admin)/admin/(protected)/estadisticas/page.tsx
import { cache } from "react";

const getStats = cache(async () => {
  // Fetch con caché de 5 minutos
  return unstable_cache(
    async () => db.collection("consents").get(),
    ["stats"],
    { revalidate: 300 }
  )();
});
```

---

## 4. 📊 Proyección de Resultados

| Estado | Lecturas/Día | Costo Mensual |
|--------|--------------|---------------|
| **Actual** | 43,198 | $0 (86% límite) |
| **Post-Sprint 3.0** | ~3,000-5,000 | $0 (6-10% límite) |
| **Margen de Crecimiento** | +40,000 | ✅ |

---

## 5. 💼 Conclusión Ejecutiva

### ¿Production Ready? **NO** ❌

| Criterio | Estado | Bloqueante |
|----------|--------|------------|
| Calidad de Código | ✅ Excelente | No |
| Arquitectura | ✅ Sólida | No |
| Seguridad RBAC | ✅ Implementado | No |
| **Costos Operativos** | ❌ Crítico | **SÍ** |
| Tests E2E | ⚠️ Pendiente | No (MVP) |

### Bloqueo Principal

> El sistema consumirá 100% de la cuota gratuita de Firestore en **~2 semanas** con el uso actual.
> 
> **Sin las optimizaciones del Sprint 3.0:**
> - Opción A: Incurrir en costos (~$25-50/mes)
> - Opción B: El sistema deja de funcionar al alcanzar límite

### Recomendación

1. **BLOQUEAR** cualquier feature nuevo hasta completar Sprint 3.0
2. Ejecutar Tareas 3.0.1 y 3.0.2 esta semana (impacto inmediato)
3. Monitorear lecturas diarias en Firebase Console
4. Re-evaluar "Production Ready" tras confirmar <5k lecturas/día

---

## 📎 Checklist Sprint 3.0

- [x] **3.0.1** Eliminar `onSnapshot` de NetworkStatus ✅ (Completado 28/01/2026)
- [x] **3.0.2** Hook `useActivity` con SWR (refresh 5min) ✅ (Completado 28/01/2026)
- [x] **3.0.3** `SWRConfig` global en Admin Layout ✅ (Completado 28/01/2026)
- [x] **3.0.5** API `/api/admin/users/recent` para SWR ✅ (Completado 28/01/2026)
- [ ] **3.0.4** Firestore Persistence (IndexedDB) — Pendiente
- [ ] Validar en Firebase Console: lecturas < 5k/día
- [ ] Actualizar este documento con resultados

---

*Documento generado automáticamente por DevTwin Architect*
