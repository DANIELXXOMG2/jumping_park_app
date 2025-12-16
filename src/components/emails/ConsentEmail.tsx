/**
 * Template de Email para Consentimiento Firmado - Jumping Park
 * 
 * Diseño "Ticket de Acceso Digital" con paleta azul oscuro corporativo.
 * Compatible con todos los clientes de email (HTML tables).
 */

import { EMAIL_COLORS, EMAIL_CONFIG, getCurrentYear } from "./emailStyles";

export interface ConsentEmailProps {
  fullName: string;
  consecutivo: number;
}

/**
 * Genera el HTML del email de consentimiento con diseño corporativo.
 */
export function generateConsentEmailHtml({ fullName, consecutivo }: ConsentEmailProps): string {
  const { primary, primaryLight, accent, background, surface, surfaceMuted, textDark, textMuted, textLight, textWhite, border } = EMAIL_COLORS;
  const { logoUrl, logoWidth, companyName, address, whatsapp, whatsappLink, instagram, facebook } = EMAIL_CONFIG;
  const year = getCurrentYear();
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Tu Ticket de Acceso - ${companyName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${background}; padding: 40px 16px;">
    <tr>
      <td align="center">
        
        <!-- Card Principal -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: ${surface}; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header Azul Corporativo -->
          <tr>
            <td style="background-color: ${primary}; padding: 36px 24px; text-align: center;">
              <img src="${logoUrl}" alt="${companyName}" width="${logoWidth}" style="max-width: ${logoWidth}px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
              <h1 style="margin: 0; color: ${textWhite}; font-size: 26px; font-weight: 700;">
                ¡Todo listo para saltar! 🚀
              </h1>
            </td>
          </tr>
          
          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px 28px;">
              
              <!-- Saludo -->
              <p style="margin: 0 0 20px 0; color: ${textDark}; font-size: 17px; line-height: 1.6;">
                Hola <strong style="color: ${primary};">${fullName}</strong>, tu aventura en ${companyName} comienza ahora.
              </p>
              
              <p style="margin: 0 0 24px 0; color: ${textMuted}; font-size: 15px; line-height: 1.6;">
                Hemos adjuntado tu consentimiento informado firmado digitalmente. Guárdalo como comprobante de tu visita.
              </p>
              
              <!-- Caja del Consecutivo (Ticket Style) -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td style="background-color: #eff6ff; border: 2px dashed ${primaryLight}; border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                      Tu Número de Ticket
                    </p>
                    <p style="margin: 0; color: ${primary}; font-size: 42px; font-weight: 800; letter-spacing: 2px;">
                      #${consecutivo}
                    </p>
                    <p style="margin: 12px 0 0 0; color: ${textLight}; font-size: 12px;">
                      Presenta este número en recepción
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Mensaje de despedida -->
              <p style="margin: 0 0 24px 0; color: ${textMuted}; font-size: 15px; line-height: 1.6;">
                ¡Te esperamos con los trampolines listos! Recuerda llegar con ropa cómoda y medias antideslizantes.
              </p>
              
              <!-- Botón CTA WhatsApp -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${whatsappLink}?text=Hola,%20tengo%20el%20ticket%20%23${consecutivo}" 
                       style="display: inline-block; background-color: ${accent}; color: ${textWhite}; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 50px; box-shadow: 0 4px 12px rgba(46, 204, 113, 0.35);">
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
                  <td style="border-top: 1px solid ${border};"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Información de contacto -->
          <tr>
            <td style="padding: 28px; background-color: ${surfaceMuted};">
              
              <!-- Ubicación -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="32" valign="top">
                    <span style="font-size: 18px;">📍</span>
                  </td>
                  <td style="color: ${textMuted}; font-size: 13px; line-height: 1.5;">
                    <strong style="color: ${textDark};">Encuéntranos en:</strong><br/>
                    ${address}
                  </td>
                </tr>
              </table>
              
              <!-- Teléfono -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="32" valign="top">
                    <span style="font-size: 18px;">📞</span>
                  </td>
                  <td style="color: ${textMuted}; font-size: 13px; line-height: 1.5;">
                    <strong style="color: ${textDark};">WhatsApp:</strong><br/>
                    <a href="tel:${whatsapp.replace(/\s/g, '')}" style="color: ${primaryLight}; text-decoration: none;">${whatsapp}</a>
                  </td>
                </tr>
              </table>
              
              <!-- Redes Sociales -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <!-- Instagram -->
                    <a href="${instagram}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 8px; padding: 10px 16px;">
                            <span style="color: ${textWhite}; font-size: 13px; font-weight: 600;">📸 Instagram</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                    <!-- Facebook -->
                    <a href="${facebook}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background-color: #1877F2; border-radius: 8px; padding: 10px 16px;">
                            <span style="color: ${textWhite}; font-size: 13px; font-weight: 600;">👍 Facebook</span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer con Copyright -->
          <tr>
            <td style="background-color: ${primary}; padding: 20px 28px; text-align: center;">
              <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 11px; line-height: 1.5;">
                © ${year} <strong style="color: ${textWhite};">${companyName}</strong> - Villavicencio<br/>
                <span style="color: rgba(255,255,255,0.5);">Powered by ${companyName}</span>
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
