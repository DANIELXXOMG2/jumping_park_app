/**
 * ============================================================================
 * EPS COLOMBIA - LISTA ESTANDARIZADA
 * ============================================================================
 * 
 * Sistema de salud colombiano organizado por régimen:
 * - CONTRIBUTIVO: Trabajadores formales y sus familias
 * - SUBSIDIADO: Población de bajos recursos (SISBEN)
 * - ESPECIAL/EXCEPCIÓN: Fuerzas militares, magisterio, etc.
 * - PARTICULAR: Sin afiliación al sistema de salud
 * 
 * Última actualización: Diciembre 2024
 * Fuente: Supersalud Colombia
 */

export type RegimenType = 
  | "contributivo" 
  | "subsidiado" 
  | "especial" 
  | "particular";

export interface EPSOption {
  value: string;
  label: string;
  regimen: RegimenType[];
}

export interface RegimenOption {
  value: RegimenType;
  label: string;
  description: string;
  icon: string;
}

/**
 * Tipos de régimen de salud en Colombia
 */
export const regimenesOptions: RegimenOption[] = [
  {
    value: "contributivo",
    label: "Contributivo",
    description: "Trabajadores formales, independientes y sus familias",
    icon: "💼",
  },
  {
    value: "subsidiado",
    label: "Subsidiado",
    description: "Población vulnerable afiliada por el SISBEN",
    icon: "🏥",
  },
  {
    value: "especial",
    label: "Especial / Excepción",
    description: "Fuerzas militares, magisterio, Ecopetrol, universidades",
    icon: "⭐",
  },
  {
    value: "particular",
    label: "Particular / Sin EPS",
    description: "Sin afiliación al sistema de salud o medicina prepagada",
    icon: "👤",
  },
];

/**
 * Lista completa de EPS activas en Colombia
 * Organizadas por popularidad dentro de cada régimen
 */
export const epsOptions: EPSOption[] = [
  // ═══════════════════════════════════════════════════════════════════
  // EPS CONTRIBUTIVO (Las más comunes primero)
  // ═══════════════════════════════════════════════════════════════════
  { 
    value: "nueva_eps", 
    label: "Nueva EPS", 
    regimen: ["contributivo", "subsidiado"] 
  },
  { 
    value: "sanitas", 
    label: "EPS Sanitas", 
    regimen: ["contributivo"] 
  },
  { 
    value: "sura", 
    label: "EPS Sura", 
    regimen: ["contributivo"] 
  },
  { 
    value: "salud_total", 
    label: "Salud Total EPS", 
    regimen: ["contributivo"] 
  },
  { 
    value: "compensar", 
    label: "Compensar EPS", 
    regimen: ["contributivo"] 
  },
  { 
    value: "famisanar", 
    label: "Famisanar", 
    regimen: ["contributivo", "subsidiado"] 
  },
  { 
    value: "comfenalco_valle", 
    label: "Comfenalco Valle", 
    regimen: ["contributivo"] 
  },
  { 
    value: "comfenalco_antioquia", 
    label: "Comfenalco Antioquia", 
    regimen: ["contributivo"] 
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // EPS SUBSIDIADO Y MIXTO
  // ═══════════════════════════════════════════════════════════════════
  { 
    value: "coosalud", 
    label: "Coosalud EPS", 
    regimen: ["subsidiado", "contributivo"] 
  },
  { 
    value: "mutual_ser", 
    label: "Mutual Ser", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "asmet_salud", 
    label: "Asmet Salud", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "emssanar", 
    label: "Emssanar EPS", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "sos", 
    label: "Servicio Occidental de Salud (S.O.S)", 
    regimen: ["contributivo", "subsidiado"] 
  },
  { 
    value: "capital_salud", 
    label: "Capital Salud", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "savia_salud", 
    label: "Savia Salud", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "cajacopi", 
    label: "Cajacopi Atlántico", 
    regimen: ["subsidiado", "contributivo"] 
  },
  { 
    value: "mallamas", 
    label: "Mallamas EPS Indígena", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "anas_wayuu", 
    label: "Anas Wayuu", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "pijaos_salud", 
    label: "Pijaos Salud EPSI", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "dusakawi", 
    label: "Dusakawi EPSI", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "comfaoriente", 
    label: "Comfaoriente", 
    regimen: ["subsidiado"] 
  },
  { 
    value: "comfasucre", 
    label: "Comfasucre", 
    regimen: ["subsidiado"] 
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // REGÍMENES ESPECIALES Y DE EXCEPCIÓN
  // ═══════════════════════════════════════════════════════════════════
  { 
    value: "fuerzas_militares", 
    label: "Sanidad Fuerzas Militares", 
    regimen: ["especial"] 
  },
  { 
    value: "policia_nacional", 
    label: "Sanidad Policía Nacional", 
    regimen: ["especial"] 
  },
  { 
    value: "ecopetrol", 
    label: "Fondo de Salud Ecopetrol", 
    regimen: ["especial"] 
  },
  { 
    value: "magisterio", 
    label: "Fondo de Prestaciones del Magisterio (FOMAG)", 
    regimen: ["especial"] 
  },
  { 
    value: "universidades_publicas", 
    label: "Salud Universidades Públicas", 
    regimen: ["especial"] 
  },
  { 
    value: "ferrocarriles", 
    label: "Ferrocarriles Nacionales", 
    regimen: ["especial"] 
  },
  { 
    value: "inpec", 
    label: "INPEC (Sistema Penitenciario)", 
    regimen: ["especial"] 
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // OPCIONES ESPECIALES
  // ═══════════════════════════════════════════════════════════════════
  { 
    value: "otra", 
    label: "Otra EPS no listada", 
    regimen: ["contributivo", "subsidiado", "especial"] 
  },
  { 
    value: "particular", 
    label: "Particular / Sin EPS", 
    regimen: ["particular"] 
  },
  { 
    value: "prepagada", 
    label: "Medicina Prepagada (sin EPS)", 
    regimen: ["particular"] 
  },
];

/**
 * Obtiene las EPS filtradas por régimen
 */
export function getEPSByRegimen(regimen: RegimenType): EPSOption[] {
  return epsOptions.filter((eps) => eps.regimen.includes(regimen));
}

/**
 * Obtiene el label de una EPS por su value
 */
export function getEPSLabel(value: string): string {
  const eps = epsOptions.find((e) => e.value === value);
  return eps?.label || value;
}

/**
 * Obtiene el label del régimen por su value
 */
export function getRegimenLabel(value: RegimenType): string {
  const regimen = regimenesOptions.find((r) => r.value === value);
  return regimen?.label || value;
}

/**
 * Valida si un valor de EPS es válido
 */
export function isValidEPS(value: string): boolean {
  return epsOptions.some((eps) => eps.value === value) || value === "otra_manual";
}

/**
 * Lista simple de valores de EPS para usar con Zod
 * Incluye todas las EPS válidas como array de strings
 */
export const EPS_LIST = epsOptions.map((eps) => eps.value) as [string, ...string[]];

/**
 * Lista de labels de EPS para mostrar en UI
 */
export const EPS_LABELS = epsOptions.map((eps) => eps.label);
