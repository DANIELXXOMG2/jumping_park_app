"use client";

import { useState, useRef, useCallback } from "react";
import {
  UseFieldArrayReturn,
  UseFormRegister,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import {
  Plus,
  Trash2,
  User,
  Camera,
  FileText,
  ScanLine,
  Baby,
  Calendar,
  Heart,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ConsentFormData, Minor } from "@/lib/schemas/consent.schema";
import { useOCRScanner, useUISound } from "@/hooks";

type TabMode = "manual" | "scan";

interface MinorsSectionProps {
  fields: UseFieldArrayReturn<ConsentFormData, "minors", "id">["fields"];
  append: UseFieldArrayReturn<ConsentFormData, "minors", "id">["append"];
  remove: UseFieldArrayReturn<ConsentFormData, "minors", "id">["remove"];
  register: UseFormRegister<ConsentFormData>;
  setValue: UseFormSetValue<ConsentFormData>;
  errors: FieldErrors<ConsentFormData>;
}

const defaultMinor: Minor = {
  firstName: "",
  lastName: "",
  birthDate: "",
  eps: "",
  idType: "ti",
  idNumber: "",
  relationship: "hijo",
};

export function MinorsSection({
  fields,
  append,
  remove,
  register,
  setValue,
  errors,
}: MinorsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>("manual");
  const [ocrSuccess, setOcrSuccess] = useState(false);
  
  // Hook de OCR
  const { scanning, progress, error: ocrError, parsedData, scanImage, reset: resetOCR } = useOCRScanner();
  
  // Hook de sonidos UI para feedback auditivo
  const { playSuccess, playError, playClick, playScanComplete } = useUISound();
  
  // Ref para el input de cámara
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handler para cambiar de tab con feedback sonoro
   */
  const handleTabChange = useCallback((tab: TabMode) => {
    if (tab !== activeTab) {
      playClick();
      setActiveTab(tab);
      // Resetear estado de OCR al cambiar de tab
      if (tab === "manual") {
        setOcrSuccess(false);
        resetOCR();
      }
    }
  }, [activeTab, playClick, resetOCR]);

  const handleAddMinor = () => {
    playClick();
    setIsFormOpen(true);
    setActiveTab("manual");
    setOcrSuccess(false);
    resetOCR();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setOcrSuccess(false);
    resetOCR();
  };

  const handleAppendAndClose = () => {
    append(defaultMinor);
    // El formulario se mantiene abierto para que el usuario llene los datos
  };

  // Handler para abrir la cámara
  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  // Handler para procesar la imagen capturada
  const handleImageCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrSuccess(false);

    try {
      const result = await scanImage(file);
      
      // Si tenemos datos parseados, agregar un nuevo menor con los datos
      const hasValidData = result.parsedData.documentNumber || result.parsedData.firstName || result.parsedData.birthDate;
      
      if (hasValidData) {
        const newMinorData: Minor = {
          firstName: result.parsedData.firstName || "",
          lastName: result.parsedData.lastName || "",
          birthDate: result.parsedData.birthDate || "",
          eps: "",
          idType: "ti",
          idNumber: result.parsedData.documentNumber || "",
          relationship: "hijo",
        };

        // Agregar el menor al array
        append(newMinorData);
        
        // Obtener el índice del menor recién agregado
        const newIndex = fields.length;

        // Establecer los valores en el formulario (autocompletado)
        if (result.parsedData.firstName) {
          setValue(`minors.${newIndex}.firstName`, result.parsedData.firstName);
        }
        if (result.parsedData.lastName) {
          setValue(`minors.${newIndex}.lastName`, result.parsedData.lastName);
        }
        if (result.parsedData.birthDate) {
          setValue(`minors.${newIndex}.birthDate`, result.parsedData.birthDate);
        }
        if (result.parsedData.documentNumber) {
          setValue(`minors.${newIndex}.idNumber`, result.parsedData.documentNumber);
        }

        setOcrSuccess(true);
        
        // 🔊 Feedback sonoro: éxito
        playScanComplete();
        playSuccess();
        
        // 📣 Toast de éxito con datos detectados
        const detectedFields = [
          result.parsedData.firstName && "nombre",
          result.parsedData.lastName && "apellido",
          result.parsedData.birthDate && "fecha",
          result.parsedData.documentNumber && "documento",
        ].filter(Boolean);
        
        toast.success("✅ Datos leídos correctamente", {
          description: `Campos detectados: ${detectedFields.join(", ")}`,
          duration: 4000,
        });
        
        // Limpiar estado visual después de 3 segundos
        setTimeout(() => {
          setOcrSuccess(false);
        }, 3000);
      } else {
        // OCR completado pero sin datos útiles
        playError();
        
        // 📣 Toast de advertencia
        toast.warning("⚠️ No se detectó documento", {
          description: "Intenta con mejor iluminación o enfoque",
          duration: 4000,
        });
      }
    } catch {
      // 🔊 Reproducir sonido de error cuando el OCR falla
      playError();
      
      // 📣 Toast de error
      toast.error("❌ Error al procesar imagen", {
        description: "Ocurrió un problema al escanear. Intenta de nuevo.",
        duration: 4000,
      });
      
      console.error("Error en OCR");
    }

    // Limpiar el input para permitir seleccionar la misma imagen
    event.target.value = "";
  }, [scanImage, append, setValue, fields.length, playScanComplete, playError, playSuccess]);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Baby className="w-6 h-6 text-neon-green" />
          <h2 className="text-xl font-semibold text-neon-green">
            Menores Acompañantes
          </h2>
        </div>

        {/* Botón de Acción Principal */}
        <button
          type="button"
          onClick={handleAddMinor}
          className="flex items-center gap-2 px-5 py-3 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 border border-neon-green/50 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Agregar Menor
        </button>
      </div>

      {/* Lista de Menores Agregados (Chips/Cards) */}
      {fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((field, index) => (
            <MinorCard
              key={field.id}
              index={index}
              register={register}
              errors={errors}
              onRemove={() => remove(index)}
              isExpanded={true}
            />
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {fields.length === 0 && !isFormOpen && (
        <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-900/30">
          <Baby className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No has agregado menores aún.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Si ingresas solo, puedes continuar sin agregar menores.
          </p>
        </div>
      )}

      {/* Modal/Panel de Agregar Menor */}
      {isFormOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              type="button"
              onClick={() => handleTabChange("manual")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-colors",
                activeTab === "manual"
                  ? "bg-gray-800 text-neon-blue border-b-2 border-neon-blue"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <FileText size={18} />
              Manual
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("scan")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-colors relative",
                activeTab === "scan"
                  ? "bg-gray-800 text-neon-pink border-b-2 border-neon-pink"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <ScanLine size={18} />
              Escanear TI
            </button>
          </div>

          {/* Contenido de Tab */}
          <div className="p-4">
            {activeTab === "manual" ? (
              <div className="space-y-4">
                {/* Input oculto para cámara */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageCapture}
                  disabled={scanning}
                />

                {/* Área de Cámara/OCR */}
                <div 
                  onClick={handleCameraClick}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                    scanning 
                      ? "border-neon-blue bg-neon-blue/10 cursor-wait" 
                      : ocrSuccess 
                        ? "border-green-500 bg-green-500/10" 
                        : ocrError 
                          ? "border-red-500 bg-red-500/10"
                          : "border-gray-600 hover:border-neon-blue/50 hover:bg-gray-800/30 group"
                  )}
                >
                  {scanning ? (
                    // Estado: Procesando
                    <div className="py-2">
                      <Loader2 className="w-10 h-10 text-neon-blue mx-auto mb-2 animate-spin" />
                      <p className="text-neon-blue text-sm font-medium">
                        Procesando imagen... ⏳
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-3 max-w-xs mx-auto">
                        <div 
                          className="bg-neon-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-gray-500 text-xs mt-2">{progress}%</p>
                    </div>
                  ) : ocrSuccess ? (
                    // Estado: Éxito
                    <div className="py-2">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="text-green-500 text-sm font-medium">
                        ¡Datos extraídos correctamente! ✅
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Revisa y completa los campos faltantes
                      </p>
                    </div>
                  ) : ocrError ? (
                    // Estado: Error
                    <div className="py-2">
                      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                      <p className="text-red-500 text-sm font-medium">
                        Error al procesar imagen
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {ocrError}
                      </p>
                      <p className="text-gray-600 text-xs mt-2">
                        Toca para intentar de nuevo
                      </p>
                    </div>
                  ) : (
                    // Estado: Inicial
                    <>
                      <Camera className="w-10 h-10 text-gray-500 mx-auto mb-2 group-hover:text-neon-blue transition-colors" />
                      <p className="text-gray-400 text-sm font-medium">
                        📸 Tomar foto al documento
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        Escanea la Tarjeta de Identidad para llenar automáticamente
                      </p>
                    </>
                  )}
                </div>

                {/* Mensaje de datos detectados */}
                {ocrSuccess && parsedData && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                    <p className="text-green-400 text-sm font-medium mb-2">
                      Datos detectados:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {parsedData.documentNumber && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Doc:</span> {parsedData.documentNumber}
                        </p>
                      )}
                      {parsedData.firstName && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Nombre:</span> {parsedData.firstName}
                        </p>
                      )}
                      {parsedData.lastName && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Apellido:</span> {parsedData.lastName}
                        </p>
                      )}
                      {parsedData.birthDate && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">F. Nac:</span> {parsedData.birthDate}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Instrucciones */}
                <p className="text-gray-500 text-xs text-center">
                  O completa los datos manualmente:
                </p>

                {/* Botón para agregar formulario */}
                <button
                  type="button"
                  onClick={handleAppendAndClose}
                  className="w-full py-3 bg-neon-green hover:bg-green-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Crear Tarjeta de Menor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Input oculto para cámara (compartido) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageCapture}
                  disabled={scanning}
                />

                {/* Área de escaneo funcional */}
                <div 
                  onClick={handleCameraClick}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                    scanning 
                      ? "border-neon-pink bg-neon-pink/10 cursor-wait" 
                      : ocrSuccess 
                        ? "border-green-500 bg-green-500/10" 
                        : ocrError 
                          ? "border-red-500 bg-red-500/10"
                          : "border-gray-600 bg-gray-800/20 hover:border-neon-pink/50"
                  )}
                >
                  {scanning ? (
                    // Estado: Procesando
                    <div>
                      <div className="relative w-32 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 border-2 border-neon-pink rounded-lg" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-neon-pink animate-spin" />
                        </div>
                        {/* Línea de escaneo animada */}
                        <div 
                          className="absolute left-0 right-0 h-0.5 bg-neon-pink animate-pulse"
                          style={{ 
                            top: `${(progress % 100)}%`,
                            boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)"
                          }}
                        />
                      </div>
                      <p className="text-neon-pink text-sm font-medium">
                        Escaneando documento... ⏳
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-3 max-w-xs mx-auto">
                        <div 
                          className="bg-neon-pink h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-gray-500 text-xs mt-2">{progress}% completado</p>
                    </div>
                  ) : ocrSuccess ? (
                    // Estado: Éxito
                    <div>
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-green-500 text-sm font-medium">
                        ¡Documento escaneado exitosamente! ✅
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Se ha agregado un nuevo menor con los datos detectados
                      </p>
                    </div>
                  ) : ocrError ? (
                    // Estado: Error
                    <div>
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-red-500 text-sm font-medium">
                        No se pudo leer el documento
                      </p>
                      <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">
                        Asegúrate de que la imagen esté bien iluminada y enfocada
                      </p>
                      <button
                        type="button"
                        onClick={handleCameraClick}
                        className="mt-3 px-4 py-2 bg-neon-pink/20 text-neon-pink text-sm rounded-lg hover:bg-neon-pink/30 transition-colors"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  ) : (
                    // Estado: Inicial
                    <>
                      <div className="relative w-32 h-20 mx-auto mb-4 border-2 border-gray-500 rounded-lg flex items-center justify-center group-hover:border-neon-pink transition-colors">
                        <CreditCard className="w-12 h-12 text-gray-500" />
                        <div className="absolute inset-0 border-2 border-neon-pink/30 rounded-lg animate-pulse" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">
                        📷 Toca para escanear Tarjeta de Identidad
                      </p>
                      <p className="text-gray-600 text-xs mt-2 max-w-xs mx-auto">
                        Posiciona el documento frente a la cámara para extraer los datos automáticamente
                      </p>
                    </>
                  )}
                </div>

                {/* Mensaje de datos detectados */}
                {ocrSuccess && parsedData && (
                  <div className="bg-neon-pink/10 border border-neon-pink/30 rounded-xl p-3">
                    <p className="text-neon-pink text-sm font-medium mb-2">
                      📋 Datos extraídos del documento:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {parsedData.documentNumber && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Documento:</span> {parsedData.documentNumber}
                        </p>
                      )}
                      {parsedData.firstName && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Nombres:</span> {parsedData.firstName}
                        </p>
                      )}
                      {parsedData.lastName && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Apellidos:</span> {parsedData.lastName}
                        </p>
                      )}
                      {parsedData.birthDate && (
                        <p className="text-gray-300">
                          <span className="text-gray-500">Nacimiento:</span> {parsedData.birthDate}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tips de escaneo */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs">
                    💡 <span className="text-gray-500">Tips:</span> Buena iluminación • Documento plano • Sin reflejos
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer con botón cerrar */}
          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={handleCloseForm}
              className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cerrar panel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================
   Tarjeta Individual de Menor
======================================== */

interface MinorCardProps {
  index: number;
  register: UseFormRegister<ConsentFormData>;
  errors: FieldErrors<ConsentFormData>;
  onRemove: () => void;
  isExpanded?: boolean;
}

function MinorCard({
  index,
  register,
  errors,
  onRemove,
}: MinorCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden group hover:border-gray-600 transition-colors">
      {/* Header de la tarjeta */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neon-green/20 flex items-center justify-center">
            <User className="w-4 h-4 text-neon-green" />
          </div>
          <span className="text-sm font-medium text-white">
            Menor #{index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
          title="Eliminar menor"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Campos del formulario */}
      <div className="p-4 space-y-3">
        {/* Fila 1: Nombre y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <User size={12} />
              Nombre
            </label>
            <input
              {...register(`minors.${index}.firstName`)}
              placeholder="Nombre"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all"
            />
            {errors.minors?.[index]?.firstName && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.minors[index]?.firstName?.message}
              </span>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <User size={12} />
              Apellidos
            </label>
            <input
              {...register(`minors.${index}.lastName`)}
              placeholder="Apellidos"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all"
            />
            {errors.minors?.[index]?.lastName && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.minors[index]?.lastName?.message}
              </span>
            )}
          </div>
        </div>

        {/* Fila 2: Fecha Nacimiento y EPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar size={12} />
              Fecha Nacimiento
            </label>
            <input
              type="date"
              {...register(`minors.${index}.birthDate`)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all"
            />
            {errors.minors?.[index]?.birthDate && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.minors[index]?.birthDate?.message}
              </span>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Heart size={12} />
              EPS
            </label>
            <input
              {...register(`minors.${index}.eps`)}
              placeholder="EPS del menor"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all"
            />
            {errors.minors?.[index]?.eps && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.minors[index]?.eps?.message}
              </span>
            )}
          </div>
        </div>

        {/* Fila 3: Tipo ID y Número */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <CreditCard size={12} />
              Tipo Identificación
            </label>
            <select
              {...register(`minors.${index}.idType`)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all appearance-none cursor-pointer"
            >
              <option value="ti">Tarjeta Identidad</option>
              <option value="cc">Cédula</option>
              <option value="passport">Pasaporte</option>
              <option value="otro">Otro</option>
            </select>
            {errors.minors?.[index]?.idType && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.minors[index]?.idType?.message}
              </span>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <CreditCard size={12} />
              Número ID
            </label>
            <input
              {...register(`minors.${index}.idNumber`)}
              placeholder="Número de documento"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all"
            />
            {errors.minors?.[index]?.idNumber && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.minors[index]?.idNumber?.message}
              </span>
            )}
          </div>
        </div>

        {/* Fila 4: Parentesco */}
        <div>
          <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Heart size={12} />
            Parentesco
          </label>
          <select
            {...register(`minors.${index}.relationship`)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all appearance-none cursor-pointer"
          >
            <option value="hijo">Hijo/a</option>
            <option value="sobrino">Sobrino/a</option>
            <option value="nieto">Nieto/a</option>
            <option value="otro">Otro</option>
          </select>
          {errors.minors?.[index]?.relationship && (
            <span className="text-red-500 text-xs mt-1 block">
              {errors.minors[index]?.relationship?.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
