/**
 * Componentes de Email para Jumping Park
 * 
 * Exporta los generadores de HTML para emails transaccionales
 * con diseño corporativo (paleta azul oscuro).
 */

export { generateOtpEmailHtml, type OtpEmailProps } from "./OtpEmail";
export { generateConsentEmailHtml, type ConsentEmailProps } from "./ConsentEmail";
export { EMAIL_COLORS, EMAIL_CONFIG, getCurrentYear } from "./emailStyles";
