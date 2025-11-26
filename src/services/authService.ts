import { Resend } from "resend";
import { createDoc, deleteDoc, getDocById } from "../lib/firestoreService";
import type { OtpRecord, UserProfile } from "../types/firestore";

const resend = new Resend(process.env.RESEND_API_KEY);

export type SendOtpResult = {
  success: boolean;
  error?: string;
};

export async function getUserByCedula(cedula: string): Promise<UserProfile | null> {
  console.log("[AuthService] Buscando en 'users' con ID:", cedula);
  return await getDocById<UserProfile>("users", cedula);
}

export async function saveOtp(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const otpRecord: OtpRecord = {
    email,
    code,
    expiresAt,
    attempts: 0,
  };

  try {
    await createDoc("otps", otpRecord, email);
  } catch (error) {
    console.error("Error guardando OTP en Firestore", error);
    throw new Error("No se pudo guardar el OTP");
  }
}

export async function sendOtpEmail(email: string, otp: string): Promise<SendOtpResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY faltante");
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  console.log(`[AuthService] Intentando enviar correo a: ${email}`);

  try {
    const { data, error } = await resend.emails.send({
      from: "Jumping Park <no-reply@jumpingpark.lat>",
      to: email,
      subject: "Tu código de acceso - Jumping Park",
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 24px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 32px; text-align: center;">
                <tr>
                  <td style="font-size: 18px; color: #111827;">Usa este código para validar tu acceso</td>
                </tr>
                <tr>
                  <td style="font-size: 40px; letter-spacing: 6px; font-weight: bold; color: #10b981; padding: 24px 0;">${otp}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #6b7280;">Este código expira en pocos minutos. Si no solicitaste este acceso, ignora este correo.</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
    });

    if (error) {
      console.error("[AuthService] Error respuesta Resend:", error);
      return { success: false, error: error.message };
    }

    console.log(`[AuthService] Correo enviado exitosamente. ID: ${data?.id}`);
    return { success: true };
  } catch (error) {
    console.error("[AuthService] Excepción enviando correo:", error);
    return { success: false, error: "No se pudo enviar el correo de OTP" };
  }
}

export async function validateOtp(
  email: string,
  code: string,
): Promise<{ valid: boolean; message: string }> {
  try {
    console.log(`[AuthService] Buscando OTP para email: ${email}`);
    // Usamos el email como ID del documento, consistente con saveOtp
    const otpDoc = await getDocById("otps", email);
    
    if (!otpDoc) {
      console.warn(`[AuthService] No se encontró documento OTP para: ${email}`);
      return { valid: false, message: "Código no solicitado o expirado" };
    }

    const matchesCode = otpDoc.code === code;
    const rawExpiresAt = otpDoc.expiresAt as Date | { toDate?: () => Date };
    const expiresAtDate = rawExpiresAt && "toDate" in rawExpiresAt && typeof rawExpiresAt.toDate === "function"
      ? rawExpiresAt.toDate()
      : (rawExpiresAt as Date);
    const isExpired = expiresAtDate <= new Date();

    if (!matchesCode) {
      console.warn(`[AuthService] Código incorrecto. Recibido: ${code}, Esperado: ${otpDoc.code}`);
      return { valid: false, message: "Código incorrecto" };
    }

    if (isExpired) {
      console.warn(`[AuthService] Código expirado. Expiró en: ${expiresAtDate}`);
      await deleteDoc("otps", email);
      return { valid: false, message: "Código expirado" };
    }

    console.log(`[AuthService] OTP válido. Eliminando documento.`);
    await deleteDoc("otps", email);
    return { valid: true, message: "OTP válido" };
  } catch (error) {
    console.error("Error validando OTP", error);
    return { valid: false, message: "No se pudo validar el OTP" };
  }
}
