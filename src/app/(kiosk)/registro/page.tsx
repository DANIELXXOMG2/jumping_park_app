'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { visitorSchema, type VisitorFormValues } from "@/lib/schemas/visitor.schema";
import { useKioskStore } from "@/store/kioskStore";

export default function RegistroPage() {
  const router = useRouter();
  const visitorData = useKioskStore((state) => state.visitorData);
  const updateVisitorData = useKioskStore((state) => state.updateVisitorData);
  const setStep = useKioskStore((state) => state.setStep);

  const cedula = visitorData.uid ?? "";
  const hasCedula = Boolean(cedula);

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      fullName: visitorData.fullName ?? "",
      email: visitorData.email ?? "",
      phone: visitorData.phone ?? "",
      address: visitorData.address ?? "",
      cedula,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!cedula) return;
    const currentCedula = form.getValues("cedula");
    if (currentCedula !== cedula) {
      form.setValue("cedula", cedula, { shouldDirty: false });
    }
  }, [cedula, form]);

  const onSubmit: SubmitHandler<VisitorFormValues> = async (values) => {
    setServerError(null);
    setServerMessage(null);
    try {
      const normalizedAddress = values.address?.trim() ? values.address.trim() : undefined;
      updateVisitorData({
        uid: values.cedula,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        address: normalizedAddress,
      });

      const response = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, cedula: values.cedula }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No pudimos enviar el OTP");
      }

      setStep(2);
      setServerMessage("Enviamos un código a tu correo");
      router.push("/otp");
    } catch (error) {
      console.error("Error registrando visitante", error);
      setServerError(error instanceof Error ? error.message : "No pudimos continuar. Intentá de nuevo.");
    }
  };

  const renderError = (message?: string) =>
    message ? <p className="text-sm text-red-300">{message}</p> : null;

  const fieldClasses = "w-full rounded-3xl border border-white/15 bg-black/30 px-6 py-4 text-lg text-white placeholder:text-white/40";

  if (!hasCedula) {
    return (
      <section className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-4xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Paso 1</p>
          <h1 className="text-4xl font-semibold text-foreground">Empecemos desde el inicio</h1>
          <p className="text-base text-white/70">
            Necesitamos que ingreses primero tu cédula para continuar con el registro.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/ingreso")}
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-4xl flex-col gap-6 rounded-4xl border border-white/10 bg-white/5 p-10 text-left shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg"
      >
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Paso 1</p>
          <h1 className="text-4xl font-semibold text-foreground">Ingresá tus datos</h1>
          <p className="text-base text-white/70">
            Necesitamos tu información para generar el consentimiento y enviarte el código de verificación.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wide text-white/70">Nombre completo</label>
            <input
              type="text"
              className={fieldClasses}
              placeholder="Ej. Ana María López"
              {...register("fullName")}
            />
            {renderError(errors.fullName?.message)}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wide text-white/70">Correo electrónico</label>
            <input
              type="email"
              className={fieldClasses}
              placeholder="nombre@correo.com"
              {...register("email")}
            />
            {renderError(errors.email?.message)}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wide text-white/70">Teléfono</label>
            <input
              type="tel"
              className={fieldClasses}
              placeholder="300 123 4567"
              {...register("phone")}
            />
            {renderError(errors.phone?.message)}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold uppercase tracking-wide text-white/70">Dirección (opcional)</label>
            <input
              type="text"
              className={fieldClasses}
              placeholder="Calle 123 #45-67"
              {...register("address")}
            />
            {renderError(errors.address?.message)}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-wide text-white/70">Cédula</label>
          <input
            type="text"
            className={`${fieldClasses} cursor-not-allowed bg-black/40 text-white/80`}
            readOnly
            {...register("cedula")}
          />
          {renderError(errors.cedula?.message)}
        </div>

        {serverError && (
          <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-lg text-red-100">
            {serverError}
          </div>
        )}

        {serverMessage && !serverError && (
          <div className="rounded-3xl border border-green-500/40 bg-green-500/10 px-6 py-4 text-lg text-green-100">
            {serverMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center rounded-3xl px-10 py-4 text-xl font-semibold uppercase tracking-wide text-[#050505] shadow-[0_20px_70px_rgba(195,255,45,0.35)] disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-3 text-lg">
              <Loader2 className="h-6 w-6 animate-spin" /> Guardando...
            </span>
          ) : (
            "Guardar y Continuar"
          )}
        </button>
      </form>
    </section>
  );
}
