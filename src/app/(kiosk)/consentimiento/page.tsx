"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useKioskStore } from "@/store/kioskStore";
import { consentSchema, type ConsentFormData } from "@/lib/schemas/consent.schema";
import SignaturePad, { SignaturePadRef } from "@/components/kiosk/SignaturePad";

export default function ConsentPage() {
  const router = useRouter();
  const { visitorData, resetFlow } = useKioskStore();
  const signatureRef = useRef<SignaturePadRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      alert("Por favor, firme el documento.");
      return;
    }

    const signatureBase64 = signatureRef.current?.toDataURL();
    if (!signatureBase64) return;

    setIsSubmitting(true);

    try {
      // Prepare payload
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

      console.log("Enviando consentimiento:", payload);

      const response = await fetch("/api/consentimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el consentimiento");
      }

      alert("Consentimiento firmado correctamente. ID: " + result.consentId);
      
      // Here we would redirect to success or next step
      // For now, just reset and go back to start or success page
      // router.push("/exito"); 
      // Since /exito doesn't exist yet in the prompt, I'll just alert and maybe reset
      resetFlow();
      router.push("/ingreso"); // Back to start for now

    } catch (error) {
      console.error("Error submitting consent:", error);
      alert("Hubo un error al guardar el consentimiento. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update signature in form state when user draws
  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setValue("signature", "signed", { shouldValidate: true });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col max-w-4xl mx-auto">
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
        <section className="flex-1 min-h-[200px] bg-white text-black p-6 rounded-xl overflow-y-auto max-h-[400px] shadow-inner">
          <h3 className="font-bold text-lg mb-4">TÉRMINOS Y CONDICIONES DE USO - JUMPING PARK</h3>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Yo, identificado como aparece en el encabezado, obrando en nombre propio y/o en representación de los menores relacionados, declaro que he leído, entiendo y acepto los siguientes términos:
            </p>
            <p>
              1. <strong>RIESGOS:</strong> Entiendo que el uso de las atracciones de Jumping Park implica actividad física y riesgos inherentes, incluyendo pero no limitado a caídas, golpes, y lesiones. Asumo voluntariamente todos los riesgos asociados.
            </p>
            <p>
              2. <strong>SALUD:</strong> Certifico que yo y los menores a mi cargo estamos en condiciones físicas aptas para realizar actividad física y no sufrimos de condiciones que puedan agravarse con el uso de las instalaciones.
            </p>
            <p>
              3. <strong>REGLAS:</strong> Me comprometo a seguir todas las instrucciones del personal y las reglas de seguridad expuestas en el parque.
            </p>
            <p>
              4. <strong>IMAGEN:</strong> Autorizo el uso de fotografías o videos capturados dentro de las instalaciones para fines de seguridad o promocionales.
            </p>
            <p>
              5. <strong>EXONERACIÓN:</strong> Libero a Jumping Park, sus empleados y propietarios de cualquier responsabilidad por lesiones o daños sufridos, excepto aquellos causados por negligencia grave probada de la empresa.
            </p>
            {/* Placeholder for more text */}
            <p className="text-gray-400 italic">[... Texto legal completo ...]</p>
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

        {/* Minors Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-neon-green">Menores Acompañantes</h2>
            <button
              type="button"
              onClick={() => append({ fullName: "", birthDate: "", relationship: "hijo" })}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700"
            >
              <Plus size={16} /> Agregar Menor
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800 relative group">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Nombre Completo</label>
                  <input
                    {...register(`minors.${index}.fullName`)}
                    placeholder="Nombre del menor"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none"
                  />
                  {errors.minors?.[index]?.fullName && (
                    <span className="text-red-500 text-xs">{errors.minors[index]?.fullName?.message}</span>
                  )}
                </div>
                
                <div className="w-full md:w-40">
                  <label className="block text-xs text-gray-500 mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    {...register(`minors.${index}.birthDate`)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none"
                  />
                  {errors.minors?.[index]?.birthDate && (
                    <span className="text-red-500 text-xs">{errors.minors[index]?.birthDate?.message}</span>
                  )}
                </div>

                <div className="w-full md:w-48">
                  <label className="block text-xs text-gray-500 mb-1">Parentesco</label>
                  <select
                    {...register(`minors.${index}.relationship`)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none appearance-none"
                  >
                    <option value="hijo">Hijo/a</option>
                    <option value="sobrino">Sobrino/a</option>
                    <option value="nieto">Nieto/a</option>
                    <option value="otro">Otro</option>
                  </select>
                  {errors.minors?.[index]?.relationship && (
                    <span className="text-red-500 text-xs">{errors.minors[index]?.relationship?.message}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 md:static md:self-end md:mb-1 p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            
            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                No has agregado menores. Si ingresas solo, puedes continuar.
              </div>
            )}
          </div>
        </section>

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
    </div>
  );
}
