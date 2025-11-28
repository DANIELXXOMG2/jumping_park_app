'use client';

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { VirtualKeypad } from "@/components/kiosk/VirtualKeypad";
import { useKioskStore } from "@/store/kioskStore";

const MIN_DIGITS = 6;
const MAX_DIGITS = 15;
const OTP_ROUTE = "/otp";
const REGISTER_ROUTE = "/registro";

type CheckUserResponse = {
  exists: boolean;
  userData?: {
    emailMasked?: string;
  };
};

export default function IngresoPage() {
  const router = useRouter();
  const updateVisitorData = useKioskStore((state) => state.updateVisitorData);
  const setStep = useKioskStore((state) => state.setStep);
  const [cedula, setCedula] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const appendDigit = useCallback((digit: string) => {
    setErrorMessage(null);
    setCedula((prev) => {
      if (prev.length >= MAX_DIGITS) return prev;
      return `${prev}${digit}`;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setCedula((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  }, []);

  const handleCheckUser = useCallback(async () => {
    if (!cedula || isChecking) {
      if (!cedula) setErrorMessage("Ingresá tu número de cédula para continuar.");
      return;
    }

    if (cedula.length < MIN_DIGITS) {
      setErrorMessage(`Ingresá al menos ${MIN_DIGITS} dígitos.`);
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/usuarios/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ cedula }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const validationMsg = Array.isArray(payload?.details)
          ? payload.details[0]?.message
          : payload?.error;
        throw new Error(validationMsg ?? `Error ${response.status}`);
      }

      const data: CheckUserResponse = payload;
      
      if (data.exists) {
        // Usuario existe: enviamos OTP usando la cédula (el backend resuelve el email)
        const otpResponse = await fetch("/api/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cedula }),
        });

        const otpPayload = await otpResponse.json().catch(() => ({}));
        if (!otpResponse.ok) {
          throw new Error(otpPayload.error ?? "No pudimos enviar el código OTP");
        }

        // Actualizamos store con cédula y email ofuscado (para mostrar en pantalla OTP)
        updateVisitorData({ 
          uid: cedula, 
          email: data.userData?.emailMasked 
        });
        
        // TODO: Mostrar Toast "Si tus datos coinciden..." (Implementar Toast si existe librería, o usar estado local en OTP page)
        // Por ahora redirigimos
        setStep(2);
        router.push(OTP_ROUTE);
      } else {
        // Usuario no existe: redirigir a registro
        updateVisitorData({ uid: cedula });
        setStep(2); // O el paso que corresponda a registro
        router.push(REGISTER_ROUTE);
      }

    } catch (error) {
      // console.error("Error verificando cédula", error);
      const message = error instanceof Error
        ? error.message
        : "No pudimos verificar tu cédula. Intentá nuevamente.";
      setErrorMessage(message);
    } finally {
      setIsChecking(false);
    }
  }, [cedula, isChecking, router, setStep, updateVisitorData]);

  const handleSubmit = useCallback(
    (evt: FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      void handleCheckUser();
    },
    [handleCheckUser],
  );

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-8">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-4xl flex-col items-center gap-8 rounded-4xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg"
      >
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Paso 1</p>
          <h1 className="text-4xl font-semibold text-foreground">
            Ingresá tu cédula para continuar
          </h1>
          <p className="text-base text-foreground/70">
            Usamos este número para validar tu identidad y mostrar tus consentimientos previos.
          </p>
        </div>

        <div className="w-full max-w-3xl">
          <input
            type="text"
            inputMode="numeric"
            readOnly
            value={cedula}
            className="w-full rounded-[2.5rem] border border-white/15 bg-black/40 px-10 py-8 text-center text-5xl font-bold tracking-[0.4em] text-white shadow-inner shadow-black/40 focus-visible:outline-none"
            aria-label="Número de cédula ingresado"
          />
          <p className="mt-3 text-sm text-white/60">Solo números, sin puntos ni guiones. Mínimo {MIN_DIGITS} dígitos.</p>
        </div>

        {errorMessage && (
          <div className="w-full max-w-3xl rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-lg text-red-100">
            {errorMessage}
          </div>
        )}

        <VirtualKeypad
          onKeyPress={appendDigit}
          onDelete={handleDelete}
          onConfirm={() => void handleCheckUser()}
        />

        <button
          type="submit"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
        >
          Enviar
        </button>

        {isChecking && (
          <div className="flex items-center gap-3 text-lg text-white/80">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verificando cédula...
          </div>
        )}
      </form>
    </section>
  );
}
