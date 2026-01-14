/**
 * Template de Email para código OTP - Jumping Park
 *
 * Diseño corporativo con paleta azul oscuro.
 * Compatible con todos los clientes de email (HTML tables).
 */

import { EMAIL_COLORS, EMAIL_CONFIG, getCurrentYear } from "./emailStyles";

export interface OtpEmailProps {
	otp: string;
}

/**
 * Genera el HTML del email OTP con diseño corporativo azul oscuro.
 */
export function generateOtpEmailHtml({ otp }: OtpEmailProps): string {
	const {
		primary,
		primaryLight,
		background,
		surface,
		textMuted,
		textLight,
		textWhite,
		warning,
		warningBg,
		warningText,
		border,
	} = EMAIL_COLORS;
	const { logoUrl, logoWidth, companyName, address } = EMAIL_CONFIG;
	const year = getCurrentYear();

	return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Código de Verificación - ${companyName}</title>
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
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: ${surface}; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header Azul Corporativo -->
          <tr>
            <td style="background-color: ${primary}; padding: 32px 24px; text-align: center;">
              <img src="${logoUrl}" alt="${companyName}" width="${logoWidth}" style="max-width: ${logoWidth}px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;" />
              <h1 style="margin: 0; color: ${textWhite}; font-size: 22px; font-weight: 700;">
                🔐 Código de Verificación
              </h1>
            </td>
          </tr>
          
          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px 28px;">
              
              <!-- Instrucciones -->
              <p style="margin: 0 0 24px 0; color: ${textMuted}; font-size: 15px; line-height: 1.6; text-align: center;">
                Usa este código para completar tu registro o ingreso en el Kiosko de ${companyName}.
              </p>
              
              <!-- Texto plano para parsers de notificaciones (iOS/Android) -->
              <p style="margin: 0 0 12px 0; color: ${textLight}; font-size: 14px; text-align: center; font-weight: 600;">
                Tu código de seguridad es: <strong style="color: ${primary}; font-size: 16px; letter-spacing: 2px;">${otp}</strong>
              </p>
              
              <!-- Caja del Código OTP -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #eff6ff; border: 2px solid ${primaryLight}; border-radius: 16px; padding: 28px 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${textLight}; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                      Tu código de acceso
                    </p>
                    <p style="margin: 0; color: ${primary}; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Advertencia de expiración -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                <tr>
                  <td style="background-color: ${warningBg}; border-radius: 8px; padding: 12px 16px; text-align: center;">
                    <p style="margin: 0; color: ${warningText}; font-size: 13px;">
                      ⏱️ Este código expira en <strong>10 minutos</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Nota de seguridad -->
              <p style="margin: 24px 0 0 0; color: ${textLight}; font-size: 12px; line-height: 1.5; text-align: center;">
                Si no solicitaste este código, puedes ignorar este correo de forma segura.
              </p>
              
            </td>
          </tr>
          
          <!-- Recordatorio Medias Antideslizantes -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: ${warningBg}; border: 1px solid ${warning}; border-radius: 12px; padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="32" valign="top">
                          <span style="font-size: 24px;">🧦</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0 0 4px 0; color: ${warningText}; font-size: 14px; font-weight: 700;">
                            Recuerda: Medias Antideslizantes
                          </p>
                          <p style="margin: 0; color: #a16207; font-size: 13px; line-height: 1.4;">
                            El uso de medias antideslizantes es <strong>obligatorio</strong>. Puedes traerlas o adquirirlas en taquilla.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Separador -->
          <tr>
            <td style="padding: 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top: 1px solid ${border};"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${primary}; padding: 20px 28px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.7); font-size: 11px;">
                📍 ${address}
              </p>
              <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 10px;">
                © ${year} <strong style="color: ${textWhite};">${companyName}</strong> - Todos los derechos reservados
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
