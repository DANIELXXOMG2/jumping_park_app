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
 * Genera el HTML del email OTP con diseño de marca "Clean Pro".
 * Mantiene consistencia visual con el correo de consentimiento.
 */
function generateOtpEmailHtml(otp: string): string {
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación - Jumping Park</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  
  <!-- Contenedor principal -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F4F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        
        <!-- Card Principal -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header con Gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #3498DB 0%, #9B59B6 100%); padding: 28px 24px; text-align: center;">
              <img src="https://www.jumpingpark.lat/assets/jumping-park-logo.png" alt="Jumping Park" width="120" style="max-width: 120px; margin-bottom: 12px;" />
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🔐 Código de Verificación
              </h1>
            </td>
          </tr>
          
          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px 28px;">
              
              <!-- Instrucciones -->
              <p style="margin: 0 0 24px 0; color: #5D6D7E; font-size: 15px; line-height: 1.6; text-align: center;">
                Usa este código para completar tu registro o ingreso en el Kiosko.
              </p>
              
              <!-- Caja del Código OTP (Protagonista) -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #F0FDF4; border: 2px solid #D1FAE5; border-radius: 16px; padding: 28px 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #7F8C8D; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                      Tu código de acceso
                    </p>
                    <p style="margin: 0; color: #2ECC71; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Advertencia de expiración -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                <tr>
                  <td style="background-color: #FEF9E7; border-radius: 8px; padding: 12px 16px; text-align: center;">
                    <p style="margin: 0; color: #9A7D0A; font-size: 13px;">
                      ⏱️ Este código expira en <strong>10 minutos</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Nota de seguridad -->
              <p style="margin: 24px 0 0 0; color: #95A5A6; font-size: 12px; line-height: 1.5; text-align: center;">
                Si no solicitaste este código, puedes ignorar este correo de forma segura.
              </p>
              
            </td>
          </tr>
          
          <!-- Separador -->
          <tr>
            <td style="padding: 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top: 1px solid #ECF0F1;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #2C3E50; padding: 20px 28px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #BDC3C7; font-size: 11px;">
                📍 C.C. Primavera Urbana, Piso 3, Local 314 - Villavicencio, Meta
              </p>
              <p style="margin: 0; color: #7F8C8D; font-size: 10px;">
                © ${currentYear} <strong style="color: #FFFFFF;">Jumping Park</strong> - Todos los derechos reservados
              </p>
            </td>
          </tr>
          
        </table>
        <!-- Fin Card Principal -->
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

/**
 * Envía un correo con el código OTP para validación de identidad.
 * Diseño: Card UI con gradiente de marca y código OTP protagonista.
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

    const htmlContent = generateOtpEmailHtml(otp);

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
 * Genera el HTML del email de consentimiento con diseño "Ticket de Acceso Digital".
 * 
 * Paleta de colores:
 * - Verde Jumping: #2ECC71 (Principal)
 * - Azul: #3498DB (Acentos)
 * - Morado Mundo Galáctico: #9B59B6 (Acentos)
 * - Fondo: #F4F4F5 (Gris claro)
 */
function generateConsentEmailHtml(fullName: string, consecutivo: number): string {
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Ticket de Acceso - Jumping Park</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F4F5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  
  <!-- Contenedor principal -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F4F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        
        <!-- Card Principal -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header con Gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #3498DB 0%, #9B59B6 100%); padding: 32px 24px; text-align: center;">
              <img src="https://www.jumpingpark.lat/assets/jumping-park-logo.png" alt="Jumping Park" width="140" style="max-width: 140px; margin-bottom: 16px;" />
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ¡Todo listo para saltar! 🚀
              </h1>
            </td>
          </tr>
          
          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px 28px;">
              
              <!-- Saludo -->
              <p style="margin: 0 0 20px 0; color: #2C3E50; font-size: 17px; line-height: 1.6;">
                Hola <strong style="color: #9B59B6;">${fullName}</strong>, tu aventura en Jumping Park comienza ahora.
              </p>
              
              <p style="margin: 0 0 24px 0; color: #5D6D7E; font-size: 15px; line-height: 1.6;">
                Hemos adjuntado tu consentimiento informado firmado digitalmente. Guárdalo como comprobante de tu visita.
              </p>
              
              <!-- Caja del Consecutivo (Ticket Style) -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td style="background-color: #F8FFF8; border: 2px dashed #2ECC71; border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #7F8C8D; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                      Tu Número de Ticket
                    </p>
                    <p style="margin: 0; color: #2ECC71; font-size: 42px; font-weight: 800; letter-spacing: 2px;">
                      #${consecutivo}
                    </p>
                    <p style="margin: 12px 0 0 0; color: #95A5A6; font-size: 12px;">
                      Presenta este número en recepción
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Mensaje de despedida -->
              <p style="margin: 0 0 24px 0; color: #5D6D7E; font-size: 15px; line-height: 1.6;">
                ¡Te esperamos con los trampolines listos! Recuerda llegar con ropa cómoda y medias antideslizantes.
              </p>
              
              <!-- Botón CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="https://wa.me/573122594245?text=Hola,%20tengo%20el%20ticket%20%23${consecutivo}" 
                       style="display: inline-block; background-color: #2ECC71; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px; box-shadow: 0 4px 12px rgba(46, 204, 113, 0.35);">
                      📱 Contáctanos por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Separador decorativo -->
          <tr>
            <td style="padding: 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top: 1px solid #ECF0F1;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer con información de contacto -->
          <tr>
            <td style="padding: 28px; background-color: #FAFBFC;">
              
              <!-- Ubicación -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="32" valign="top">
                    <span style="font-size: 18px;">📍</span>
                  </td>
                  <td style="color: #5D6D7E; font-size: 13px; line-height: 1.5;">
                    <strong style="color: #2C3E50;">Encuéntranos en:</strong><br/>
                    C.C. Primavera Urbana, Piso 3, Local 314<br/>
                    Villavicencio, Meta
                  </td>
                </tr>
              </table>
              
              <!-- Teléfono -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="32" valign="top">
                    <span style="font-size: 18px;">📞</span>
                  </td>
                  <td style="color: #5D6D7E; font-size: 13px; line-height: 1.5;">
                    <strong style="color: #2C3E50;">WhatsApp:</strong><br/>
                    <a href="tel:+573122594245" style="color: #3498DB; text-decoration: none;">+57 312 259 4245</a>
                  </td>
                </tr>
              </table>
              
              <!-- Redes Sociales -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <!-- Instagram -->
                    <a href="https://instagram.com/jumpingparkvillavo" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 8px; padding: 10px 16px;">
                            <span style="color: #FFFFFF; font-size: 13px; font-weight: 600;">📸 Instagram</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                    <!-- Facebook -->
                    <a href="https://facebook.com/jumpingparkvillavo" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background-color: #1877F2; border-radius: 8px; padding: 10px 16px;">
                            <span style="color: #FFFFFF; font-size: 13px; font-weight: 600;">👍 Facebook</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Copyright -->
          <tr>
            <td style="background-color: #2C3E50; padding: 20px 28px; text-align: center;">
              <p style="margin: 0; color: #BDC3C7; font-size: 11px; line-height: 1.5;">
                © ${currentYear} <strong style="color: #FFFFFF;">Jumping Park</strong> - Villavicencio<br/>
                Este correo fue enviado automáticamente. Por favor no responder.
              </p>
            </td>
          </tr>
          
        </table>
        <!-- Fin Card Principal -->
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

/**
 * Envía el correo con el PDF del consentimiento firmado.
 * Diseño: "Ticket de Acceso Digital" moderno con estilo Card UI.
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

    const htmlContent = generateConsentEmailHtml(fullName, consecutivo);

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
