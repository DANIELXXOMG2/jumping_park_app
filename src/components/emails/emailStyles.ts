/**
 * Estilos y constantes para los templates de email de Jumping Park.
 * 
 * Paleta Corporativa - Azul Oscuro:
 * - Primary: #1e3a8a (Azul Oscuro Corporativo)
 * - Primary Light: #3b82f6 (Azul más claro para acentos)
 * - Secondary: #2ECC71 (Verde Jumping - para CTAs)
 * - Background: #f3f4f6 (Gris claro)
 * - Surface: #ffffff (Blanco)
 * - Text Dark: #1f2937
 * - Text Muted: #6b7280
 */

export const EMAIL_COLORS = {
  // Azul Corporativo
  primary: "#1e3a8a",
  primaryLight: "#3b82f6",
  primaryDark: "#1e40af",
  
  // Verde Jumping (para CTAs)
  accent: "#2ECC71",
  accentHover: "#27AE60",
  
  // Fondos
  background: "#f3f4f6",
  surface: "#ffffff",
  surfaceMuted: "#f9fafb",
  
  // Textos
  textDark: "#1f2937",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  textWhite: "#ffffff",
  
  // Estados
  warning: "#f59e0b",
  warningBg: "#fef3c7",
  warningText: "#92400e",
  
  // Bordes
  border: "#e5e7eb",
  borderDashed: "#d1d5db",
} as const;

export const EMAIL_CONFIG = {
  logoUrl: "https://www.jumpingpark.lat/assets/jumping-park-logo.png",
  logoWidth: 140,
  companyName: "Jumping Park",
  address: "C.C. Primavera Urbana, Piso 3, Local 314 - Villavicencio, Meta",
  whatsapp: "+57 312 259 4245",
  whatsappLink: "https://wa.me/573122594245",
  instagram: "https://instagram.com/jumpingparkvillavo",
  facebook: "https://facebook.com/jumpingparkvillavo",
  website: "https://www.jumpingpark.lat",
} as const;

/**
 * Genera el año actual para el copyright
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}
