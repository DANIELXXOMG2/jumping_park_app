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
