import type { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Valores compatibles con Timestamp de Firestore para entornos Admin/Cliente.
 */
export type FirestoreDateValue = Date | Timestamp;

/**
 * Tipos de identificación válidos en Colombia.
 */
export type DocumentIdType = 'cc' | 'ti' | 'passport' | 'otro';

/**
 * Relaciones de parentesco válidas.
 */
export type RelationshipType = 'hijo' | 'sobrino' | 'nieto' | 'otro';

// ============================================================================
// COLECCIÓN: users
// ============================================================================

/**
 * Menor de edad asociado a un usuario responsable.
 * Puede existir embebido en UserProfile o en la colección 'minors'.
 */
export interface Minor {
  /** Nombre completo (calculado o directo) */
  fullName?: string;
  /** Nombre (para formularios que capturan separado) */
  firstName?: string;
  /** Apellidos (para formularios que capturan separado) */
  lastName?: string;
  /** Fecha de nacimiento ISO YYYY-MM-DD */
  birthDate: string;
  /** Parentesco con el responsable */
  relationship: RelationshipType;
  /** EPS del menor */
  eps?: string;
  /** Tipo de documento de identidad */
  idType?: DocumentIdType;
  /** Número de documento */
  idNumber?: string;
}

/**
 * Perfil de usuario en la colección 'users'.
 * El uid corresponde a la cédula/documento de identidad.
 */
export interface UserProfile {
  /** Identificador único (cédula del usuario) */
  uid: string;
  /** Nombre completo */
  fullName: string;
  /** Correo electrónico */
  email: string;
  /** Teléfono de contacto */
  phone: string;
  /** Dirección (opcional) */
  address?: string;
  /** Lista de menores a cargo */
  minors: Minor[];
  /** Fecha de creación del registro */
  createdAt: FirestoreDateValue;
  /** Fecha de última actualización */
  updatedAt: FirestoreDateValue;
}

// ============================================================================
// COLECCIÓN: consents
// ============================================================================

/**
 * Documento de consentimiento firmado.
 * Contiene snapshots de datos para preservar el estado al momento de la firma.
 */
export interface Consent {
  /** ID único del documento */
  id: string;
  /** Número consecutivo único (RF-08) */
  consecutivo: number;
  /** ID del usuario responsable (cédula) */
  userId: string;
  /** Snapshot del perfil del adulto al momento de la firma */
  adultSnapshot: UserProfile;
  /** Snapshot de los menores al momento de la firma */
  minorsSnapshot: Minor[];
  /** URL de la firma digital en Storage */
  signatureUrl: string;
  /** Versión de la política aceptada */
  policyVersion: string;
  /** Dirección IP desde donde se firmó */
  ipAddress?: string;
  /** Fecha y hora de la firma */
  signedAt: FirestoreDateValue;
  /** Fecha de vencimiento del consentimiento */
  validUntil: FirestoreDateValue;
  /** Fecha de creación del registro */
  createdAt?: FirestoreDateValue;
}

// ============================================================================
// COLECCIÓN: otps
// ============================================================================

/**
 * Registro de código OTP para validación de identidad.
 */
export interface OtpRecord {
  /** Email al que se envió el código */
  email: string;
  /** Código OTP (6 dígitos) */
  code: string;
  /** Fecha y hora de expiración */
  expiresAt: FirestoreDateValue;
  /** Número de intentos fallidos */
  attempts: number;
  /** Fecha de creación */
  createdAt?: FirestoreDateValue;
}

// ============================================================================
// COLECCIÓN: accesses
// ============================================================================

/**
 * Registro de acceso (entrada/salida) al parque.
 */
export interface Access {
  /** ID único del documento */
  id?: string;
  /** ID del usuario (cédula) */
  userId: string;
  /** ID del consentimiento asociado */
  consentId: string;
  /** Tipo de acceso */
  tipo: 'entrada' | 'salida';
  /** Punto de acceso (ej. "Puerta Principal") */
  punto?: string;
  /** Notas adicionales */
  notas?: string;
  /** Fecha de creación */
  createdAt?: FirestoreDateValue;
}

// ============================================================================
// COLECCIÓN: invoices
// ============================================================================

/**
 * Documento de factura.
 */
export interface Invoice {
  /** ID único del documento */
  id?: string;
  /** ID del usuario (cédula) */
  userId: string;
  /** ID de la venta asociada */
  ventaId: string;
  /** Número de factura */
  numero?: string;
  /** Subtotal antes de impuestos */
  subtotal: number;
  /** Valor del impuesto */
  impuesto: number;
  /** Total de la factura */
  total: number;
  /** Estado de la factura */
  estado: 'pendiente' | 'pagada' | 'anulada';
  /** Método de pago */
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  /** Notas adicionales */
  notas?: string;
  /** Fecha de creación */
  createdAt?: FirestoreDateValue;
}

// ============================================================================
// COLECCIÓN: services
// ============================================================================

/**
 * Servicio ofrecido en el parque.
 */
export interface Service {
  /** ID único del documento */
  id?: string;
  /** Nombre del servicio */
  nombre: string;
  /** Descripción */
  descripcion?: string;
  /** Precio unitario */
  precio: number;
  /** Duración en minutos */
  duracionMinutos?: number;
  /** Categoría del servicio */
  categoria: 'trampolines' | 'piscina_pelotas' | 'escalada' | 'arcade' | 'cafeteria' | 'otro';
  /** ¿Está activo? */
  activo: boolean;
  /** Edad mínima requerida */
  edadMinima?: number;
  /** Edad máxima permitida */
  edadMaxima?: number;
  /** ¿Requiere consentimiento firmado? (RF-10) */
  requiereConsentimiento: boolean;
  /** Fecha de creación */
  createdAt?: FirestoreDateValue;
}

// ============================================================================
// COLECCIÓN: sales
// ============================================================================

/**
 * Item individual de una venta.
 */
export interface SaleItem {
  /** ID del servicio */
  servicioId: string;
  /** Nombre del servicio (snapshot) */
  servicioNombre: string;
  /** Cantidad */
  cantidad: number;
  /** Precio unitario al momento de la venta */
  precioUnitario: number;
  /** Subtotal del item */
  subtotal: number;
}

/**
 * Transacción de venta.
 */
export interface Sale {
  /** ID único del documento */
  id?: string;
  /** ID del usuario comprador (cédula) */
  userId: string;
  /** ID del consentimiento vigente */
  consentId?: string;
  /** Items de la venta */
  items: SaleItem[];
  /** Total de la venta */
  total: number;
  /** Estado de la venta */
  estado: 'pendiente' | 'completada' | 'cancelada';
  /** Método de pago */
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  /** Notas adicionales */
  notas?: string;
  /** Fecha de creación */
  createdAt?: FirestoreDateValue;
}
