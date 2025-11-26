/**
 * EmailService - Servicio centralizado para envío de correos.
 * 
 * Centraliza la instancia de Resend y provee funciones tipadas
 * para los diferentes tipos de correos transaccionales.
 */
import { Resend } from "resend";

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

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject: "Tu código de acceso - Jumping Park",
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 24px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 32px; text-align: center;">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <img src="https://jumping-park.vercel.app/assets/logo.png" alt="Jumping Park" width="120" style="max-width: 120px;" />
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 18px; color: #111827; padding-bottom: 8px;">
                    Usa este código para validar tu acceso
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 48px; letter-spacing: 8px; font-weight: bold; color: #10b981; padding: 24px 0;">
                    ${otp}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #6b7280; padding-top: 16px;">
                    Este código expira en <strong>10 minutos</strong>.<br/>
                    Si no solicitaste este acceso, ignora este correo.
                  </td>
                </tr>
              </table>
              <table width="480" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #9ca3af; text-align: center;">
                    © ${new Date().getFullYear()} Jumping Park. Todos los derechos reservados.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
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
// CONSENT EMAIL
// ============================================================================

/**
 * Envía el correo con el PDF del consentimiento firmado.
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

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject: `Tu Consentimiento Firmado #${consecutivo} - Jumping Park`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; padding-bottom: 24px;">
            <img src="https://jumping-park.vercel.app/assets/logo.png" alt="Jumping Park" width="150" />
          </div>
          
          <h1 style="color: #10b981; font-size: 24px; margin-bottom: 16px;">
            ¡Gracias por visitarnos!
          </h1>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hola <strong>${fullName}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Adjunto encontrarás una copia de tu consentimiento informado firmado digitalmente.
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Número de Consecutivo:</strong> #${consecutivo}
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Conserva este documento como comprobante de tu visita.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            ¡Disfruta tu estancia en Jumping Park! 🎉
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Jumping Park. Todos los derechos reservados.<br/>
            Este correo fue enviado automáticamente, por favor no responder.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Consentimiento-${consecutivo}.pdf`,
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
