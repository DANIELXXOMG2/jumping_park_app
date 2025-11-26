/**
 * Schemas Zod para las colecciones CRUD genéricas.
 * Cada colección tiene su schema de creación (POST) definido aquí.
 */
import { z } from "zod";

// ============================================================================
// ACCESOS - Registro de entradas/salidas al parque
// ============================================================================

export const accesoCreateSchema = z.object({
  /** ID del usuario (cédula) */
  userId: z.string().min(6, "El ID de usuario es requerido"),

  /** ID del consentimiento asociado */
  consentId: z.string().min(1, "El ID de consentimiento es requerido"),

  /** Tipo de acceso */
  tipo: z.enum(["entrada", "salida"]).default("entrada"),

  /** Punto de acceso (ej. "Puerta Principal", "Kiosko 1") */
  punto: z.string().optional(),

  /** Notas adicionales */
  notas: z.string().max(500).optional(),
});

export type AccesoCreate = z.infer<typeof accesoCreateSchema>;

// ============================================================================
// FACTURAS - Documentos de facturación
// ============================================================================

export const facturaCreateSchema = z.object({
  /** ID del usuario (cédula) */
  userId: z.string().min(6, "El ID de usuario es requerido"),

  /** ID de la venta asociada */
  ventaId: z.string().min(1, "El ID de venta es requerido"),

  /** Número de factura (consecutivo externo) */
  numero: z.string().optional(),

  /** Subtotal antes de impuestos */
  subtotal: z.number().nonnegative("El subtotal debe ser positivo"),

  /** Valor del impuesto (IVA) */
  impuesto: z.number().nonnegative().default(0),

  /** Total de la factura */
  total: z.number().positive("El total debe ser mayor a 0"),

  /** Estado de la factura */
  estado: z.enum(["pendiente", "pagada", "anulada"]).default("pendiente"),

  /** Método de pago */
  metodoPago: z.enum(["efectivo", "tarjeta", "transferencia", "otro"]).optional(),

  /** Notas adicionales */
  notas: z.string().max(500).optional(),
});

export type FacturaCreate = z.infer<typeof facturaCreateSchema>;

// ============================================================================
// SERVICIOS - Catálogo de servicios del parque
// ============================================================================

export const servicioCreateSchema = z.object({
  /** Nombre del servicio */
  nombre: z.string().min(2, "El nombre es requerido (mínimo 2 caracteres)"),

  /** Descripción del servicio */
  descripcion: z.string().max(1000).optional(),

  /** Precio unitario */
  precio: z.number().nonnegative("El precio debe ser positivo"),

  /** Duración en minutos (para servicios con tiempo) */
  duracionMinutos: z.number().int().positive().optional(),

  /** Categoría del servicio */
  categoria: z.enum([
    "trampolines",
    "piscina_pelotas",
    "escalada",
    "arcade",
    "cafeteria",
    "otro",
  ]).default("otro"),

  /** ¿Está activo? */
  activo: z.boolean().default(true),

  /** Edad mínima requerida (años) */
  edadMinima: z.number().int().nonnegative().optional(),

  /** Edad máxima permitida (años) */
  edadMaxima: z.number().int().positive().optional(),

  /** ¿Requiere consentimiento firmado? (RF-10) */
  requiereConsentimiento: z.boolean().default(true),
});

export type ServicioCreate = z.infer<typeof servicioCreateSchema>;

// ============================================================================
// VENTAS - Transacciones de venta
// ============================================================================

const itemVentaSchema = z.object({
  /** ID del servicio */
  servicioId: z.string().min(1),

  /** Nombre del servicio (snapshot) */
  servicioNombre: z.string().min(1),

  /** Cantidad */
  cantidad: z.number().int().positive(),

  /** Precio unitario al momento de la venta */
  precioUnitario: z.number().nonnegative(),

  /** Subtotal del item */
  subtotal: z.number().nonnegative(),
});

export const ventaCreateSchema = z.object({
  /** ID del usuario comprador (cédula) */
  userId: z.string().min(6, "El ID de usuario es requerido"),

  /** ID del consentimiento vigente (RF-10: requerido para servicios que lo exijan) */
  consentId: z.string().optional(),

  /** Items de la venta */
  items: z.array(itemVentaSchema).min(1, "Debe incluir al menos un item"),

  /** Total de la venta */
  total: z.number().positive("El total debe ser mayor a 0"),

  /** Estado de la venta */
  estado: z.enum(["pendiente", "completada", "cancelada"]).default("pendiente"),

  /** Método de pago */
  metodoPago: z.enum(["efectivo", "tarjeta", "transferencia", "otro"]).optional(),

  /** Notas adicionales */
  notas: z.string().max(500).optional(),
});

export type VentaCreate = z.infer<typeof ventaCreateSchema>;

// ============================================================================
// MENORES - Menores registrados (standalone, fuera de consentimiento)
// ============================================================================

export const menorCreateSchema = z.object({
  /** Nombre del menor */
  firstName: z.string().min(2, "El nombre es requerido"),

  /** Apellidos del menor */
  lastName: z.string().min(2, "Los apellidos son requeridos"),

  /** Fecha de nacimiento (YYYY-MM-DD) */
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),

  /** EPS del menor */
  eps: z.string().min(2, "La EPS es requerida"),

  /** Tipo de identificación */
  idType: z.enum(["cc", "ti", "passport", "otro"]),

  /** Número de identificación */
  idNumber: z.string().min(3, "Número de identificación es requerido"),

  /** Parentesco con el responsable */
  relationship: z.enum(["hijo", "sobrino", "nieto", "otro"]),

  /** ID del adulto responsable (cédula) */
  responsableId: z.string().min(6, "ID del responsable es requerido"),
});

export type MenorCreate = z.infer<typeof menorCreateSchema>;

// ============================================================================
// USUARIOS - Perfil de usuario (para POST directo, no via consentimiento)
// ============================================================================

export const usuarioCreateSchema = z.object({
  /** Cédula del usuario (también es el UID) */
  uid: z.string().min(6, "La cédula debe tener al menos 6 dígitos"),

  /** Nombre completo */
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),

  /** Correo electrónico */
  email: z.string().email("Correo electrónico inválido"),

  /** Teléfono */
  phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),

  /** Dirección (opcional) */
  address: z.string().max(120).optional(),

  /** Lista de menores a cargo (inicialmente vacía) */
  minors: z.array(z.any()).default([]),
});

export type UsuarioCreate = z.infer<typeof usuarioCreateSchema>;
