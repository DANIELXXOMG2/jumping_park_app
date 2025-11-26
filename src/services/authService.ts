import { createDoc, deleteDoc, getDocById } from "../lib/firestoreService";
import { sendOtpEmail as sendOtpViaEmail } from "./emailService";
import type { OtpRecord, UserProfile } from "../types/firestore";

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

/**
 * Envía un OTP por correo electrónico.
 * Delega al emailService centralizado.
 */
export async function sendOtpEmail(email: string, otp: string): Promise<SendOtpResult> {
  // El log está en emailService - evitamos duplicación
  return sendOtpViaEmail({ to: email, otp });
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
