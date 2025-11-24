'use client';

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { VirtualKeypad } from "@/components/kiosk/VirtualKeypad";
import { useKioskStore } from "@/store/kioskStore";
import type { UserProfile } from "@/types/firestore";

const MIN_DIGITS = 6;
const MAX_DIGITS = 15;
const OTP_ROUTE = "/otp";
const REGISTER_ROUTE = "/registro";

type CheckUserResponse = {
  exists: boolean;
  userData?: {
    uid?: string;
    fullName?: string;
    email?: string;
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

  const pushNextStep = useCallback(
    (exists: boolean, payload?: CheckUserResponse["userData"]) => {
      const visitorPatch: Partial<UserProfile> = {
        uid: cedula,
      };

      if (payload?.fullName) visitorPatch.fullName = payload.fullName;
      if (payload?.email) visitorPatch.email = payload.email;

      updateVisitorData(visitorPatch);
      setStep(2);
      router.push(exists ? OTP_ROUTE : REGISTER_ROUTE);
    },
    [cedula, router, setStep, updateVisitorData],
  );

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
        if (!data.userData?.email) {
          throw new Error("El usuario no tiene correo registrado");
        }

        const otpResponse = await fetch("/api/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.userData.email, cedula }),
        });

        const otpPayload = await otpResponse.json().catch(() => ({}));
        if (!otpResponse.ok) {
          throw new Error(otpPayload.error ?? "No pudimos enviar el código OTP");
        }
      }

      pushNextStep(data.exists, data.userData);
    } catch (error) {
      console.error("Error verificando cédula", error);
      const message = error instanceof Error
        ? error.message
        : "No pudimos verificar tu cédula. Intentá nuevamente.";
      setErrorMessage(message);
    } finally {
      setIsChecking(false);
    }
  }, [cedula, isChecking, pushNextStep]);

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
