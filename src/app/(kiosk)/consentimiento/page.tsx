"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { useKioskStore } from "@/store/kioskStore";
import { consentSchema, type ConsentFormData } from "@/lib/schemas/consent.schema";
import SignaturePad, { SignaturePadRef } from "@/components/kiosk/SignaturePad";
import { ConsentReadingModal } from "@/components/kiosk/ConsentReadingModal";
import { ConsentContent } from "@/components/kiosk/ConsentContent";
import { MinorsSection } from "@/components/kiosk/MinorsSection";

export default function ConsentPage() {
  const router = useRouter();
  const { visitorData, resetFlow } = useKioskStore();
  const signatureRef = useRef<SignaturePadRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ConsentFormData>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      acceptedPolicy: false,
      minors: [],
      signature: "",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "minors",
  });

  useEffect(() => {
    if (!visitorData.uid) {
      // If no user data, redirect to start
      router.push("/ingreso");
    }
  }, [visitorData.uid, router]);

  const handleSign = async (data: ConsentFormData) => {
    if (signatureRef.current?.isEmpty()) {
      toast.error("Firma requerida", {
        description: "Por favor, firme el documento antes de continuar.",
      });
      return;
    }

    const signatureBase64 = signatureRef.current?.toDataURL();
    if (!signatureBase64) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        signature: signatureBase64,
        responsibleAdult: {
          fullName: visitorData.fullName || "",
          documentId: visitorData.uid || "",
          email: visitorData.email || "",
          phone: visitorData.phone || "",
        },
      };

      const response = await fetch("/api/consentimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el consentimiento");
      }

      // Toast de éxito con delay para que el usuario lo vea
      toast.success("¡Consentimiento firmado!", {
        description: `Consecutivo #${result.consecutivo}. Recibirás una copia por email.`,
      });

      // Pequeño delay para que el usuario vea el toast antes de redirigir
      await new Promise((resolve) => setTimeout(resolve, 1500));

      resetFlow();
      router.push("/ingreso");

    } catch (error) {
      console.error("[ConsentPage] Error:", error);
      toast.error("Error al guardar", {
        description: "Hubo un problema al guardar el consentimiento. Intente nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setValue("signature", "signed", { shouldValidate: true });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 flex flex-col w-full sm:max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neon-blue mb-2">Consentimiento y Exoneración</h1>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Responsable</p>
          <p className="text-xl font-semibold text-white">
            {visitorData.fullName || "Invitado"} 
            <span className="text-gray-500 text-sm ml-2">({visitorData.uid})</span>
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(handleSign)} className="flex-1 flex flex-col gap-8">
        {/* Terms Box */}
        <section className="relative flex-1 min-h-[200px] bg-white text-black p-6 rounded-xl overflow-y-auto max-h-[400px] shadow-inner">
          {/* Botón de expandir - esquina superior derecha */}
          <button
            type="button"
            onClick={() => setIsReadingModalOpen(true)}
            className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 bg-[#00E5FF] hover:bg-[#00B8D4] text-black text-sm font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-md"
            aria-label="Leer en pantalla completa"
          >
            <Maximize2 size={18} />
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>

          {/* Contenido reutilizado del consentimiento */}
          <div className="text-sm leading-relaxed pr-24 sm:pr-0">
            <ConsentContent variant="compact" />
          </div>
        </section>

        {/* Checkbox Acceptance */}
        <div className="flex items-start gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <input
            type="checkbox"
            id="acceptedPolicy"
            {...register("acceptedPolicy")}
            className="mt-1 w-6 h-6 rounded border-gray-600 text-neon-blue focus:ring-neon-blue bg-gray-800"
          />
          <label htmlFor="acceptedPolicy" className="text-sm cursor-pointer select-none">
            He leído, entiendo y acepto los términos y condiciones descritos anteriormente, así como la política de tratamiento de datos personales.
          </label>
        </div>
        {errors.acceptedPolicy && (
          <p className="text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {errors.acceptedPolicy.message}
          </p>
        )}

        {/* Minors Section - Nuevo componente con tarjetas */}
        <MinorsSection
          fields={fields}
          append={append}
          remove={remove}
          register={register}
          setValue={setValue}
          errors={errors}
        />

        {/* Signature Section */}
        <section className="mt-4">
          <h2 className="text-xl font-semibold text-neon-pink mb-4">Firma Digital</h2>
          <SignaturePad ref={signatureRef} onEnd={handleSignatureEnd} />
          {errors.signature && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
              <AlertCircle size={16} /> {errors.signature.message}
            </p>
          )}
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-neon-blue hover:bg-blue-600 text-black font-bold text-xl rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
        >
          {isSubmitting ? (
            "Procesando..."
          ) : (
            <>
              ACEPTAR Y FIRMAR <CheckCircle2 size={24} />
            </>
          )}
        </button>
      </form>

      {/* Modal de Lectura Inmersiva */}
      <ConsentReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
      >
        <ConsentContent variant="expanded" />
      </ConsentReadingModal>
    </div>
  );
}
