/**
 * Componentes de Email para Jumping Park
 *
 * Exporta los generadores de HTML para emails transaccionales
 * con diseño corporativo (paleta azul oscuro).
 */

export {
	type ConsentEmailProps,
	generateConsentEmailHtml,
} from "./ConsentEmail";
export { EMAIL_COLORS, EMAIL_CONFIG, getCurrentYear } from "./emailStyles";
export { generateOtpEmailHtml, type OtpEmailProps } from "./OtpEmail";
