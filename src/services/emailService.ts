/**
 * EmailService - Servicio centralizado para envío de correos.
 * 
 * Centraliza la instancia de Resend y provee funciones tipadas
 * para los diferentes tipos de correos transaccionales.
 * 
 * Templates: src/components/emails/ (paleta azul corporativo)
 */
import { Resend } from "resend";
import { generateOtpEmailHtml } from "@/components/emails/OtpEmail";
import { generateConsentEmailHtml } from "@/components/emails/ConsentEmail";

// ============================================================================
// SINGLETON RESEND CLIENT
// ============================================================================

const resend = new Resend(process.env.RESEND_API_KEY);

// Configuración del remitente
const FROM_EMAIL = "Jumping Park <no-reply@jumpingpark.lat>";
const FROM_EMAIL_DEV = "Jumping Park <onboarding@resend.dev>"; // Para desarrollo

function getFromEmail(): string {
  // En desarrollo usamos el email de Resend para pruebas
  return process.env.NODE_ENV === "production" ? FROM_EMAIL : FROM_EMAIL_DEV;
}

// ============================================================================
// TYPES
// ============================================================================

export interface SendOtpEmailParams {
  to: string;
  otp: string;
}

export interface SendConsentEmailParams {
  to: string;
  fullName: string;
  consecutivo: number;
  pdfBuffer: Buffer;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// OTP EMAIL
// ============================================================================

/**
 * Envía un correo con el código OTP para validación de identidad.
 * Template: src/components/emails/OtpEmail.tsx (paleta azul corporativo)
 * 
 * Falla silenciosamente logueando el error para no romper el flujo principal.
 */
export async function sendOtpEmail(params: SendOtpEmailParams): Promise<EmailResult> {
  const { to, otp } = params;

  if (!process.env.RESEND_API_KEY) {
    console.error("[EmailService] RESEND_API_KEY no configurada");
    return { success: false, error: "Servicio de email no configurado" };
  }

  try {
    console.log(`[EmailService] Enviando OTP a: ${to}`);

    const htmlContent = generateOtpEmailHtml({ otp });

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject: "🔐 Tu Código de Verificación - Jumping Park",
      html: htmlContent,
    });

    if (error) {
      console.error("[EmailService] Error de Resend:", error);
      return { success: false, error: error.message };
    }

    console.log(`[EmailService] OTP enviado exitosamente. ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error("[EmailService] Excepción enviando OTP:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
}

// ============================================================================
// CONSENT EMAIL - TICKET DE ACCESO DIGITAL
// ============================================================================

/**
 * Envía el correo con el PDF del consentimiento firmado.
 * Template: src/components/emails/ConsentEmail.tsx (paleta azul corporativo)
 * 
 * Falla silenciosamente logueando el error para no romper el flujo principal.
 */
export async function sendConsentEmail(params: SendConsentEmailParams): Promise<EmailResult> {
  const { to, fullName, consecutivo, pdfBuffer } = params;

  if (!process.env.RESEND_API_KEY) {
    console.error("[EmailService] RESEND_API_KEY no configurada");
    return { success: false, error: "Servicio de email no configurado" };
  }

  try {
    console.log(`[EmailService] Enviando consentimiento #${consecutivo} a: ${to}`);

    const htmlContent = generateConsentEmailHtml({ fullName, consecutivo });

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject: `🎟️ Tu Ticket de Acceso #${consecutivo} - Jumping Park`,
      html: htmlContent,
      attachments: [
        {
          filename: `Consentimiento-JumpingPark-${consecutivo}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[EmailService] Error de Resend:", error);
      return { success: false, error: error.message };
    }

    console.log(`[EmailService] Consentimiento enviado exitosamente. ID: ${data?.id}`);
    return { success: true, messageId: data?.id };

  } catch (error) {
    console.error("[EmailService] Excepción enviando consentimiento:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    };
  }
}
