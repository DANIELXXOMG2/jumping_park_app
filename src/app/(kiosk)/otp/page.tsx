'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { VirtualKeypad } from "@/components/kiosk/VirtualKeypad";
import { OtpDisplay } from "@/components/kiosk/OtpDisplay";
import { useKioskStore } from "@/store/kioskStore";

const OTP_LENGTH = 6;
const CONSENT_ROUTE = "/consentimiento";
const INGRESO_ROUTE = "/ingreso";

const maskEmail = (email: string) => {
  if (email.includes("*")) return email; // Ya está ofuscado
  const [localPart, domainPart] = email.split("@");
  if (!domainPart) return email;
  const safeLocal = `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 3))}`;
  const [domainName, ...rest] = domainPart.split(".");
  const safeDomain = `${domainName.slice(0, 1)}***`;
  const tld = rest.join(".");
  return `${safeLocal}@${safeDomain}${tld ? `.${tld}` : ""}`;
};

export default function OtpPage() {
  const router = useRouter();
  const visitorData = useKioskStore((state) => state.visitorData);
  const updateVisitorData = useKioskStore((state) => state.updateVisitorData); // Necesitamos actualizar datos
  const setAuthenticated = useKioskStore((state) => state.setAuthenticated);
  const setStep = useKioskStore((state) => state.setStep);

  const email = visitorData.email;
  const cedula = visitorData.uid;
  // Permitimos que isReady sea true si tenemos cédula O email. 
  // En flujo ingreso tenemos cédula y email ofuscado.
  // En flujo registro tenemos email real y cédula.
  const isReady = Boolean(cedula || email);

  const [otp, setOtp] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const RESEND_SECONDS = 20; 
  const [resendCooldown, setResendCooldown] = useState(RESEND_SECONDS);

  const maskedEmail = useMemo(() => (email ? maskEmail(email) : ""), [email]);

  const handleDigit = useCallback((digit: string) => {
    if (!/^[0-9]$/.test(digit)) return;
    setErrorMessage(null);
    setOtp((prev) => {
      if (prev.length >= OTP_LENGTH) return prev;
      return `${prev}${digit}`;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setOtp((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    setErrorMessage(null);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData("text") ?? "";
    const digits = pasted.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (digits.length) {
      setOtp(digits);
      setErrorMessage(null);
    }
    // Prevent the default to avoid any unexpected text insertion
    e.preventDefault();
  }, []);

  const validateCode = useCallback(
    async (code: string) => {
      if (code.length !== OTP_LENGTH) return;
      if (isValidating) return; 

      setIsValidating(true);
      setErrorMessage(null);
      setResendMessage(null);

      try {
        const isEmailMasked = email?.includes("*");
        
        const payload = { 
          code, 
          email: isEmailMasked ? undefined : (email || undefined),
          cedula: cedula || undefined
        };

        const response = await fetch("/api/otp/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Código incorrecto o expirado");
          }
          if (response.status === 500) {
            throw new Error("Error del sistema, intenta reenviar");
          }
          throw new Error(data.error ?? "Código inválido");
        }

        if (!data.success) {
          throw new Error(data.error ?? "Código inválido");
        }

      
        if (data.userData) {
          updateVisitorData(data.userData);
        }

        setAuthenticated(true);
        setStep(3);
        router.push(CONSENT_ROUTE);
        
      } catch (error) {
       
        setErrorMessage(error instanceof Error ? error.message : "Código incorrecto");
        setOtp("");
        setIsValidating(false); 
      }
    },
    [cedula, email, router, setAuthenticated, setStep, updateVisitorData, isValidating],
  );

  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isValidating) {
      void validateCode(otp);
    }
  }, [otp, isValidating, validateCode]);

  const handleConfirm = useCallback(() => {
    if (otp.length === OTP_LENGTH && !isValidating) {
      void validateCode(otp);
    }
  }, [otp, isValidating, validateCode]);

  const handleResend = useCallback(async () => {
    if (isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setResendMessage(null);
    setOtp("");

    try {
      const isEmailMasked = email?.includes("*");
      const payload: Record<string, string> = {};
      if (!isEmailMasked && email) payload.email = email;
      if (cedula) payload.cedula = cedula;

      if (!payload.email && !payload.cedula) {
        setErrorMessage("No hay datos válidos para reenviar el código");
        setIsResending(false);
        return;
      }

      const response = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No pudimos reenviar el código");
      }

      setResendMessage("Enviamos un nuevo código a tu correo");
      
      setResendCooldown(RESEND_SECONDS);
    } catch (error) {
      
      setErrorMessage(error instanceof Error ? error.message : "No pudimos reenviar el código");
    } finally {
      setIsResending(false);
    }
  }, [cedula, email, isResending]);

  
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!isReady) {
    return (
      <section className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-4xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Paso 2</p>
          <h1 className="text-4xl font-semibold text-foreground">Necesitamos validar tu correo</h1>
          <p className="text-base text-white/70">
            Para ingresar el código OTP primero tenés que registrar tu cédula y correo en el paso anterior.
          </p>
          <button
            type="button"
            onClick={() => router.replace(INGRESO_ROUTE)}
            className="rounded-3xl px-10 py-4 text-xl font-semibold uppercase tracking-wide text-[#050505] shadow-[0_20px_70px_rgba(195,255,45,0.35)]"
          >
            Volver a Ingreso
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8 rounded-4xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Paso 2</p>
          <h1 className="text-4xl font-semibold text-foreground">Ingresá el código de verificación</h1>
          <p className="text-base text-foreground/70">
            Hemos enviado un código a <span className="text-primary">{maskedEmail}</span>
          </p>
        </div>

        <div className="relative w-full" onClick={() => inputRef.current?.focus()}>
          <OtpDisplay value={otp} length={OTP_LENGTH} />
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => handleInputChange(e.target.value)}
            onPaste={handlePaste}
            className="absolute inset-0 h-full w-full opacity-0 cursor-text"
            aria-label="Ingresar código"
            maxLength={OTP_LENGTH}
          />
        </div>

        {errorMessage && (
          <div className="w-full max-w-3xl rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-lg text-red-100">
            {errorMessage}
          </div>
        )}

        {resendMessage && !errorMessage && (
          <div className="w-full max-w-3xl rounded-3xl border border-green-500/30 bg-green-500/10 px-6 py-3 text-base text-green-100">
            {resendMessage}
          </div>
        )}

        <VirtualKeypad
          onKeyPress={handleDigit}
          onDelete={handleDelete}
          onConfirm={handleConfirm}
          isLoading={isValidating}
        />

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" strokeWidth={1.5} />
            )}
            {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : "Reenviar código"}
          </button>

          {isValidating && (
            <div className="flex items-center gap-2 text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              Validando código...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
