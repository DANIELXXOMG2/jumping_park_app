# 📊 Arquitectura de Datos - Jumping Park App

> **Documento técnico** para justificar decisiones de diseño de base de datos NoSQL (Firestore).

---

## 1. Resumen Ejecutivo

Este documento analiza las **duplicidades de datos** identificadas en el modelo de Firestore del sistema Jumping Park. Cada duplicidad se clasifica como:

| Clasificación | Descripción | Acción |
|--------------|-------------|--------|
| ✅ **Desnormalización por Lectura** | Patrón válido en NoSQL para optimizar consultas | Mantener |
| ⚠️ **Redundancia Accidental** | Dato duplicado sin beneficio claro | Corregir |

---

## 2. Colecciones del Sistema

```
┌─────────────────┐
│     users       │ ← Perfil del adulto responsable
│  (cédula = ID)  │
├─────────────────┤
│ - fullName      │
│ - email         │
│ - phone         │
│ - minors[]      │ ← Array embebido de menores
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│    consents     │ ← Consentimientos firmados
├─────────────────┤
│ - userId (FK)   │
│ - adultSnapshot │ ← 📸 Copia del perfil al momento de firma
│ - minorsSnapshot│ ← 📸 Copia de menores al momento de firma
│ - signatureUrl  │
│ - consecutivo   │
└─────────────────┘

┌─────────────────┐
│     minors      │ ← Colección standalone (opcional)
├─────────────────┤
│ - responsableId │ ← FK a users
│ - firstName     │
│ - lastName      │
│ - birthDate     │
│ - eps           │
└─────────────────┘

┌─────────────────┐        ┌─────────────────┐
│   otp_sessions  │        │     accesses    │
├─────────────────┤        ├─────────────────┤
│ - userId        │        │ - userId        │
│ - email         │        │ - consentId     │
│ - validatedAt   │        │ - tipo          │
│ - expiresAt     │        │ - createdAt     │
└─────────────────┘        └─────────────────┘

┌─────────────────┐        ┌─────────────────┐
│     sales       │        │    services     │
├─────────────────┤        ├─────────────────┤
│ - userId        │        │ - nombre        │
│ - items[]       │        │ - precio        │
│   - servicioNombre 📸    │ - categoria     │
│   - precioUnitario 📸    │ - activo        │
└─────────────────┘        └─────────────────┘
```

---

## 3. Análisis de Duplicidades

### 3.1. `adultSnapshot` en Consents

| Campo | Ubicación Original | Ubicación Duplicada |
|-------|-------------------|---------------------|
| `fullName`, `email`, `phone`, `address` | `users/{uid}` | `consents/{id}.adultSnapshot` |

#### 📋 Clasificación: ✅ DESNORMALIZACIÓN POR LECTURA

**Justificación técnica:**

1. **Requisito Legal**: El consentimiento informado es un documento legal. Los datos del firmante **deben preservarse exactamente como estaban al momento de la firma**, incluso si el usuario actualiza su perfil posteriormente.

2. **Inmutabilidad Documental**: Si el usuario cambia de teléfono o corrige su nombre, el consentimiento firmado hace 6 meses debe mostrar los datos originales para auditorías.

3. **Optimización de Lectura**: Al generar PDFs o exportar consentimientos, toda la información está disponible en un solo documento sin necesidad de JOINs.

4. **Referencia normativa**: [Firebase Best Practices - Denormalization](https://firebase.google.com/docs/firestore/data-model#denormalization)

```typescript
// consentService.ts línea 254
const consent: Consent = {
  // ...
  adultSnapshot: userProfile,  // ✅ Snapshot intencional
  minorsSnapshot: normalizedMinors,
  // ...
};
```

---

### 3.2. `minorsSnapshot` en Consents

| Campo | Ubicación Original | Ubicación Duplicada |
|-------|-------------------|---------------------|
| `fullName`, `birthDate`, `eps`, etc. | `users/{uid}.minors[]` | `consents/{id}.minorsSnapshot[]` |

#### 📋 Clasificación: ✅ DESNORMALIZACIÓN POR LECTURA

**Justificación técnica:**

1. **Snapshot Temporal**: Los menores crecen. El consentimiento debe reflejar la edad del menor **al momento de ingreso al parque**, no su edad actual.

2. **Historial Médico**: Si el EPS del menor cambia, los registros históricos de consentimiento deben mantener el EPS que tenía cuando se firmó (para reclamaciones médicas).

3. **Consistencia Documental**: El PDF generado refleja los datos exactos del momento de la firma.

```typescript
// src/types/firestore.ts línea 91-92
/** Snapshot de los menores al momento de la firma */
minorsSnapshot: Minor[];
```

---

### 3.3. Menores en `users.minors[]` vs Colección `minors`

| Campo | Ubicación 1 | Ubicación 2 |
|-------|------------|-------------|
| Datos completos del menor | `users/{uid}.minors[]` (embebido) | `minors/{id}` (standalone) |

#### 📋 Clasificación: ⚠️ REDUNDANCIA ACCIDENTAL (Parcial)

**Análisis:**

- La colección `minors` standalone existe para consultas administrativas (listar todos los menores del sistema).
- El array `users.minors[]` existe para acceso rápido desde el perfil del usuario.

**Problema Identificado:**
- Los datos pueden divergir si se actualiza uno y no el otro.
- No hay sincronización automática entre ambas fuentes.

**Recomendación:**

| Opción | Descripción | Complejidad |
|--------|-------------|-------------|
| A) Eliminar `minors` collection | Usar solo el array embebido + queries de collectionGroup | Baja |
| B) Sincronizar con Cloud Functions | Trigger `onWrite` que actualice ambos | Media |
| C) Single Source of Truth | `minors` como fuente única, `users.minors[]` solo IDs | Alta |

**Decisión sugerida:** Opción **A** para MVP. El array embebido es suficiente y evita inconsistencias.

```typescript
// ACTUAL (potencialmente redundante)
users/{uid}.minors[] = [...fullMinorData]
minors/{id} = {...fullMinorData, responsableId}

// RECOMENDADO (single source)
users/{uid}.minors[] = [...fullMinorData]
// Eliminar colección "minors" standalone
```

---

### 3.4. `servicioNombre` en Sales Items

| Campo | Ubicación Original | Ubicación Duplicada |
|-------|-------------------|---------------------|
| `nombre` | `services/{id}.nombre` | `sales/{id}.items[].servicioNombre` |

#### 📋 Clasificación: ✅ DESNORMALIZACIÓN POR LECTURA

**Justificación técnica:**

1. **Historial de Precios**: Los precios de servicios cambian. La venta debe reflejar el precio y nombre **al momento de la compra**.

2. **Reportes Financieros**: Los reportes de ventas no deben verse afectados si se renombra un servicio en el futuro.

3. **Patrón Estándar**: Este es el patrón clásico de "line items" en sistemas de facturación.

```typescript
// src/types/firestore.ts línea 239-244
export interface SaleItem {
  servicioId: string;          // FK para lookup
  servicioNombre: string;      // ✅ Snapshot al momento de venta
  precioUnitario: number;      // ✅ Snapshot del precio
  cantidad: number;
  subtotal: number;
}
```

---

### 3.5. `userId` en Múltiples Colecciones

| Colección | Campo |
|-----------|-------|
| `consents` | `userId` |
| `otp_sessions` | `userId` |
| `accesses` | `userId` |
| `sales` | `userId` |
| `invoices` | `userId` |

#### 📋 Clasificación: ✅ DESNORMALIZACIÓN POR LECTURA

**Justificación técnica:**

Este NO es una duplicidad sino una **Foreign Key desnormalizada**. Es el patrón estándar en NoSQL para:

1. Permitir queries por usuario sin JOINs.
2. Mantener la relación 1:N entre usuarios y sus documentos.
3. Habilitar reglas de seguridad basadas en `userId`.

```javascript
// firebase/firestore.rules
match /consents/{consentId} {
  allow read: if isAdmin() || 
    request.auth.token.uid == resource.data.userId;
}
```

---

### 3.6. `email` en `users` vs `otp_sessions`

| Campo | Ubicación 1 | Ubicación 2 |
|-------|------------|-------------|
| `email` | `users/{uid}.email` | `otp_sessions/{id}.email` |

#### 📋 Clasificación: ✅ DESNORMALIZACIÓN POR LECTURA

**Justificación técnica:**

1. **Validación de Sesión**: El email en `otp_sessions` permite verificar que el OTP fue validado para el email correcto sin consultar la colección `users`.

2. **Seguridad**: Si el usuario cambia su email en `users`, las sesiones OTP anteriores mantienen el email original para trazabilidad.

3. **Rendimiento**: Verificar la sesión OTP no requiere lookup adicional.

---

## 4. Matriz de Decisiones

| Duplicidad | Tipo | Justificación | Decisión |
|------------|------|---------------|----------|
| `adultSnapshot` | Desnormalización | Requisito legal de inmutabilidad | ✅ Mantener |
| `minorsSnapshot` | Desnormalización | Historial temporal de menores | ✅ Mantener |
| `users.minors[]` + `minors` collection | Redundancia Parcial | Doble fuente de verdad | ⚠️ Evaluar eliminación de `minors` |
| `servicioNombre` en ventas | Desnormalización | Historial de precios | ✅ Mantener |
| `userId` en colecciones | Foreign Key | Patrón estándar NoSQL | ✅ Mantener |
| `email` en OTP | Desnormalización | Trazabilidad y seguridad | ✅ Mantener |

---

## 5. Principios de Diseño Aplicados

### 5.1. Modelo de Lectura Optimizado

> "En Firestore, es preferible duplicar datos para optimizar lecturas que hacer múltiples queries para armar un documento."

### 5.2. Inmutabilidad de Documentos Legales

> "Los consentimientos firmados son documentos legales inmutables. Los snapshots preservan el estado exacto al momento de la firma."

### 5.3. Event Sourcing Implícito

> "Cada consentimiento actúa como un 'evento' que captura el estado completo, permitiendo reconstruir el historial."

---

## 6. Referencias

1. [Firebase Data Modeling Best Practices](https://firebase.google.com/docs/firestore/manage-data/structure-data)
2. [NoSQL Denormalization Patterns](https://www.mongodb.com/docs/manual/data-modeling/data-model-design/)
3. [Martin Fowler - NoSQL Distilled](https://martinfowler.com/books/nosql.html)

---

## 7. Changelog

| Fecha | Autor | Cambios |
|-------|-------|---------|
| 2025-12-16 | Sistema | Documento inicial creado |

---

> **Nota para Profesores**: Este documento justifica las decisiones de arquitectura tomadas en el proyecto Jumping Park. Las "duplicidades" identificadas son en su mayoría patrones de desnormalización válidos para bases de datos NoSQL, excepto el caso de `users.minors[]` + colección `minors` que requiere evaluación para el siguiente sprint.
