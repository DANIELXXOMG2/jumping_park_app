"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
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
        <section className="flex-1 min-h-[200px] bg-white text-black p-6 rounded-xl overflow-y-auto max-h-[400px] shadow-inner">
          <h3 className="font-bold text-lg mb-4 text-center uppercase">Consentimiento Informado para la Práctica de Actividades Deportivas</h3>
          <p className="text-center font-semibold mb-4">&quot;Es una actividad deportiva que puede ocasionar lesiones leves o importantes&quot;</p>
          
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Yo, identificado como aparece en el encabezado, mayor de edad, obrando en nombre propio y/o en representación de los menores relacionados en este formulario digital, <strong>CON MI FIRMA, MANIFIESTO QUE:</strong>
            </p>
            
            <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Jumping Park</strong>, les ha informado mediante diversas maneras (pantalla, carteleras y resalta de manera verbal las más importantes) sobre las características de la actividad deportiva en que van a participar y sobre las condiciones físicas requeridas para dicha participación, así como lo muestran las Reglas Publicadas en el establecimiento.</li>
                <li><strong>Jumping Park</strong>, me ha informado, de manera suficiente, detallada y clara (pantalla, carteleras y resalta de manera verbal las más importantes) sobre los riesgos de las actividades físicas que van a practicar dentro del establecimiento, sobre la idoneidad de los guías y sobre las medidas mínimas de seguridad que se deben adoptar en la realización de las actividades.</li>
                <li>He informado de manera voluntaria, libre y sincera, que las personas a mi cargo carecen de contraindicación o limitación médica alguna que les impida desarrollar en debida forma las actividades a realizar en <strong>Jumping Park</strong>.</li>
                <li>Ninguna se encuentra en estado de embarazo y que de estarlo practicaran las actividades físicas bajo su propio riesgo, eximiendo de cualquier responsabilidad a <strong>Jumping Park</strong>, del daño o perjuicio que la práctica dentro del establecimiento pueda generar.</li>
                <li>NO uso de accesorios (anillos, relojes, cadena o derivados) que puedan poner en riesgo la integridad física de los participantes.</li>
                <li>Las actividades que realizaremos en <strong>Jumping Park</strong> serán bajo nuestra propia responsabilidad.</li>
                <li>Desde el ingreso a las instalaciones de <strong>Jumping Park</strong>, se me dio a conocer el reglamento (pantalla, carteleras y resalta de manera verbal las más importantes) para la realización de las actividades deportivas, condiciones de seguridad de estas, riesgos inherentes a las actividades, lo cual asumo bajo mi propio riesgo y patrimonio en cuanto a los daños que eventualmente se puedan generar a alguno del grupo y que pude evidenciar y leer todos los Reglamentos publicados en el establecimiento.</li>
                <li>Manifiesto conocer y entender las normas reguladoras de las actividades que desarrollaremos dentro del establecimiento, que estoy conforme con ellas y que nos someteremos a las reglas, dirección, disciplina y control por parte de los funcionarios autorizados de <strong>Jumping Park</strong>, quedando bajo mi exclusiva responsabilidad actuar de manera contraria a ellas.</li>
                <li>Asumo todos los riesgos de la actividad del grupo y, en consecuencia, eximo a <strong>Jumping Park</strong> de cualquier daño o perjuicio que pueda sufrir en el desarrollo de la actividad.</li>
                <li>Ninguno se encuentra bajo la influencia del alcohol o cualquier droga, sustancia ilícita o medicamentos que pueda afectar la capacidad física o poner en riesgo la salud para participar en las actividades dentro del establecimiento.</li>
                <li>Autorizo a <strong>Jumping Park</strong> a sección de derechos de uso de imagen y autorización para tratamiento de datos personales, utilizar las fotografías y/o grabaciones que nos realicen en el desarrollo de la actividad, para publicidad y promoción del establecimiento, sin que esto implique, ningún tipo de contraprestación, para lo cual este escrito corresponde a una renuncia expresa de cualquier tipo de reclamación patrimonial al respecto.</li>
                <li>Que de conformidad con la ley 1581 de 2012 o ley de Habeas Data autorizo para que <strong>Jumping Park</strong>, recopile, almacene, use y suprima los datos personales aquí suministrados, especialmente, aquellos que son definidos como datos sensibles.</li>
                <li>Todos los participantes están afiliados a una EPS, como lo dicta el Régimen Contributivo de Seguridad Social.</li>
                <li>En caso de que los participantes no estén afiliados a una EPS, yo me hago responsable con mi patrimonio de cualquier situación desafortunada, después de ser atendido por la póliza de área protegida de <strong>Jumping Park</strong>, en la que se brinda primeros auxilios y se lleva al accidentado (en caso de que lo hubiera) hasta la clínica de mi preferencia; eximiendo a <strong>Jumping Park</strong> de cualquier responsabilidad.</li>
                <li>El personal no está autorizado a hacerse responsable de los participantes en ausencia de los padres o acudientes, o de abandonar las instalaciones del parque por parte de los participantes ya que no se presta servicio de guardería.</li>
                <li><strong>APOYARÉ LAS DECISIONES DEL PERSONAL ENCARGADO DEL PARQUE, PARA PRESERVAR LA SEGURIDAD DE LOS PARTICIPANTES Y EN ESPECIAL LA DEL GRUPO DEL QUE SOY RESPONSABLE.</strong></li>
                <li>El uso de las medias antideslizantes es obligatorio para el Ingreso a las áreas de Juego.</li>
            </ol>

            <p className="mt-4 font-semibold">
              Mediante mi firma manifiesto que Jumping Park, me ha puesto en conocimiento el documento sobre consentimiento informado para practicar actividades físicas de todas las personas registradas al respaldo, dentro de su establecimiento, que lo he leído y certifico que toda la información que yo consigne en este formato es veraz y completa, también en estar de acuerdo con las futuras normas o reglas que sean estipuladas por el establecimiento.
            </p>

            <hr className="my-6 border-gray-300" />

            <h3 className="font-bold text-lg mb-2 text-center uppercase">Bienvenido a Jumping Park</h3>
            <p className="mb-4">
              Asegúrese de leer y haber visto el video de estas reglas antes de entrar a nuestro parque de trampolines. Al igual que con todos los deportes y actividades físicas, siempre existe la posibilidad de accidentes o lesiones graves y nosotros estamos aquí para evitar que usted se haga daño o les haga daño a otras personas. Reglas son reglas y estamos seguros de que las puede cumplir.
            </p>

            <ul className="list-disc pl-5 space-y-1">
                <li>Antes de iniciar a saltar debe haber diligenciado el formulario de inscripción y haber firmado la carta de consentimiento.</li>
                <li>Los menores de seis (6) años con condiciones especiales o zona galáctica deben estar acompañados por sus padres o un adulto responsable.</li>
                <li>Al ingresar a la zona del parque no tenga nada en la boca (chicles, dulces, etc.).</li>
                <li>Retire sus zapatos y medias lisas. Solo se ingresa con medias que tengan goma antideslizante.</li>
                <li>Retire y guarde todas sus joyas (anillos, cadenas, pulseras, relojes, entre otras). Vacíe completamente sus bolsillos antes de saltar.</li>
                <li>No se permite el ingreso si tiene alguna limitación de salud (cardiacas, vértigo, lumbares, etc.) o lesiones recientes.</li>
                <li>No salte si se encuentra bajo la influencia del alcohol.</li>
                <li>No se permite el ingreso si está en embarazo.</li>
                <li>No salte con objetos afilados o dispositivos no autorizados (cámaras, teléfonos, etc.).</li>
                <li>No aterrice sobre la cabeza o cuello en la zona de juegos.</li>
                <li>No interrumpa el salto de otra persona de ninguna manera.</li>
                <li>Si está cansado, debe salir y descansar fuera de la zona de salto.</li>
                <li>No se siente o acueste sobre el trampolín, siempre debe estar saltando mientras esté sobre los trampolines.</li>
                <li>No corra sobre los trampolines ni pasillos, no haga carreras.</li>
                <li>No salte sobre las protecciones de los trampolines.</li>
                <li>No se cuelgue de las escaleras o agarre de las protecciones de los trampolines, especialmente de las camas inclinadas.</li>
                <li>No empuje, juegue brusco o realice trucos peligrosos o imprudentes.</li>
                <li>No debe perder el control de su cuerpo en ningún momento.</li>
                <li>No ingiera alimentos, bebidas en los trampolines, ni pasillos.</li>
                <li>No haga salto mortal doble o cualquier pirueta similar.</li>
                <li>No realice saltos en un trampolín con más personas. Solo debe saltar una persona por trampolín.</li>
                <li>Tenga cuidado con las personas que están a su lado, en especial las de menor tamaño. Debe alejarse hacia otros trampolines más libres.</li>
                <li>Sea consciente de los que lo rodean e intercambie saltos con las personas que son de su mismo tamaño.</li>
                <li>No toque ninguna parte de la estructura metálica del parque.</li>
                <li>No se agarre de las mallas, ni salte sobre ellas.</li>
                <li>No deslizarse de cabeza, espalda o acostado.</li>
                <li>Ingreso a Mundo Galáctico de 80 cm a 1.30 mt (por recomendaciones del fabricante NO hay excepción).</li>
                <li>No ingresar objetos o juguetes.</li>
                <li>Mantener despejada las rutas de evacuación.</li>
                <li>No halar, colgarse o despegar piezas decorativas.</li>
                <li>En Mundo Galáctico, el menor de edad debe estar siempre acompañado por un mayor de 18 años.</li>
                <li>Espacio libre de humo.</li>
                <li>Haga caso al personal del parque y cumpla con sus instrucciones, en caso de no hacerlo será interrumpida su actividad por su seguridad y la de los demás.</li>
                <li>No se permite las agresiones físicas o verbales con otros visitantes o colaboradores ya que es causa de retiro de la atracción sin derecho a devolución de dinero.</li>
                <li>Siga todas y cada una de las reglas del parque y evite ser retirado de la actividad.</li>
            </ul>
            <p className="mt-4 text-center font-bold">¡Que se diviertan! y gracias por venir a Jumping Park.</p>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-xl font-semibold text-neon-green">Menores Acompañantes</h2>
            <button
              type="button"
              onClick={() => append({ firstName: "", lastName: "", birthDate: "", eps: "", idType: "cc", idNumber: "", relationship: "hijo" })}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700 w-full sm:w-auto"
            >
              <Plus size={16} /> Agregar Menor
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 bg-gray-900 rounded-xl border border-gray-800 relative group">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                    <input
                      {...register(`minors.${index}.firstName`)}
                      placeholder="Nombre"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none"
                    />
                    {errors.minors?.[index]?.firstName && (
                      <span className="text-red-500 text-xs">{errors.minors[index]?.firstName?.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Apellidos</label>
                    <input
                      {...register(`minors.${index}.lastName`)}
                      placeholder="Apellidos"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none"
                    />
                    {errors.minors?.[index]?.lastName && (
                      <span className="text-red-500 text-xs">{errors.minors[index]?.lastName?.message}</span>
                    )}
                  </div>

                  <div>
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

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">EPS</label>
                    <input
                      {...register(`minors.${index}.eps`)}
                      placeholder="EPS"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none"
                    />
                    {errors.minors?.[index]?.eps && (
                      <span className="text-red-500 text-xs">{errors.minors[index]?.eps?.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tipo Identificación</label>
                    <select
                      {...register(`minors.${index}.idType`)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none appearance-none"
                    >
                      <option value="cc">Cédula</option>
                      <option value="ti">Tarjeta Identidad</option>
                      <option value="passport">Pasaporte</option>
                      <option value="otro">Otro</option>
                    </select>
                    {errors.minors?.[index]?.idType && (
                      <span className="text-red-500 text-xs">{errors.minors[index]?.idType?.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Número Identificación</label>
                    <input
                      {...register(`minors.${index}.idNumber`)}
                      placeholder="Número ID"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-blue focus:outline-none"
                    />
                    {errors.minors?.[index]?.idNumber && (
                      <span className="text-red-500 text-xs">{errors.minors[index]?.idNumber?.message}</span>
                    )}
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
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
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-3 right-3 p-2 text-gray-500 hover:text-red-500 transition-colors bg-gray-800/30 rounded-md"
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
