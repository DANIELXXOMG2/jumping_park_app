import { Resend } from "resend";
import { createDoc, deleteDoc, getDocById } from "../lib/firestoreService";
import type { OtpRecord } from "../types/firestore";

const resend = new Resend(process.env.RESEND_API_KEY);

export type SendOtpResult = {
  success: boolean;
  error?: string;
};

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
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  try {
    await resend.emails.send({
      from: "Jumping Park <onboarding@resend.dev>",
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

    return { success: true };
  } catch (error) {
    console.error("Error enviando OTP con Resend", error);
    return { success: false, error: "No se pudo enviar el correo de OTP" };
  }
}

export async function validateOtp(
  email: string,
  code: string,
): Promise<{ valid: boolean; message: string }> {
  try {
    const otpDoc = await getDocById("otps", email);
    if (!otpDoc) {
      return { valid: false, message: "Código no solicitado" };
    }

    const matchesCode = otpDoc.code === code;
    const rawExpiresAt = otpDoc.expiresAt as Date | { toDate?: () => Date };
    const expiresAtDate = rawExpiresAt && "toDate" in rawExpiresAt && typeof rawExpiresAt.toDate === "function"
      ? rawExpiresAt.toDate()
      : (rawExpiresAt as Date);
    const isExpired = expiresAtDate <= new Date();

    if (!matchesCode) {
      return { valid: false, message: "Código incorrecto" };
    }

    if (isExpired) {
      await deleteDoc("otps", email);
      return { valid: false, message: "Código expirado" };
    }

    await deleteDoc("otps", email);
    return { valid: true, message: "OTP válido" };
  } catch (error) {
    console.error("Error validando OTP", error);
    return { valid: false, message: "No se pudo validar el OTP" };
  }
}
