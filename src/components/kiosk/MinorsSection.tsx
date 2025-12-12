"use client";

import { useState, useCallback } from "react";
import {
  UseFieldArrayReturn,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import {
  Plus,
  Trash2,
  User,
  Baby,
  Edit3,
  CreditCard,
  Calendar,
  Heart,
} from "lucide-react";
import type { ConsentFormData, Minor } from "@/lib/schemas/consent.schema";
import { useUISound } from "@/hooks";
import { MinorFormModal } from "./MinorFormModal";
import { getEPSLabel } from "@/lib/data/epsColombiaData";

interface MinorsSectionProps {
  fields: UseFieldArrayReturn<ConsentFormData, "minors", "id">["fields"];
  append: UseFieldArrayReturn<ConsentFormData, "minors", "id">["append"];
  remove: UseFieldArrayReturn<ConsentFormData, "minors", "id">["remove"];
  update: UseFieldArrayReturn<ConsentFormData, "minors", "id">["update"];
  setValue: UseFormSetValue<ConsentFormData>;
  getValues: UseFormGetValues<ConsentFormData>;
}

export function MinorsSection({
  fields,
  append,
  remove,
  update,
  getValues,
}: MinorsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const { playClick, playSuccess } = useUISound();

  const handleAddMinor = useCallback(() => {
    playClick();
    setEditingIndex(null);
    setIsModalOpen(true);
  }, [playClick]);

  const handleEditMinor = useCallback((index: number) => {
    playClick();
    setEditingIndex(index);
    setIsModalOpen(true);
  }, [playClick]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingIndex(null);
  }, []);

  const handleSaveMinor = useCallback((data: Minor) => {
    if (editingIndex !== null) {
      // Editando existente
      update(editingIndex, data);
    } else {
      // Agregando nuevo
      append(data);
    }
    playSuccess();
    handleCloseModal();
  }, [editingIndex, update, append, playSuccess, handleCloseModal]);

  const handleRemoveMinor = useCallback((index: number) => {
    playClick();
    remove(index);
  }, [remove, playClick]);

  // Obtener datos del menor que se está editando
  const getEditingMinorData = (): Minor | null => {
    if (editingIndex === null) return null;
    const minors = getValues("minors");
    return minors[editingIndex] || null;
  };

  // Calcular edad desde fecha de nacimiento
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  // Formatear tipo de documento
  const formatIdType = (type: string): string => {
    const types: Record<string, string> = {
      ti: "T.I.",
      cc: "C.C.",
      passport: "Pasaporte",
      otro: "Otro",
    };
    return types[type] || type;
  };

  // Formatear parentesco
  const formatRelationship = (rel: string): string => {
    const rels: Record<string, string> = {
      hijo: "Hijo/a",
      sobrino: "Sobrino/a",
      nieto: "Nieto/a",
      otro: "Otro",
    };
    return rels[rel] || rel;
  };

  // Obtener label de EPS
  const getEPSDisplayLabel = (epsValue: string): string => {
    if (!epsValue) return "Sin EPS";
    if (epsValue.startsWith("otra_manual:")) {
      return epsValue.replace("otra_manual:", "");
    }
    return getEPSLabel(epsValue);
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Baby className="w-6 h-6 text-neon-green" />
          <h2 className="text-xl font-semibold text-neon-green">
            Menores Acompañantes
            {fields.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({fields.length})
              </span>
            )}
          </h2>
        </div>

        {/* Botón de Agregar */}
        <button
          type="button"
          onClick={handleAddMinor}
          className="flex items-center gap-2 px-4 py-2.5 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 border border-neon-green/50 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Agregar Menor
        </button>
      </div>

      {/* Lista de Menores - Tarjetas Compactas */}
      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const minor = getValues(`minors.${index}`);
            return (
              <MinorCompactCard
                key={field.id}
                index={index}
                minor={minor}
                onEdit={() => handleEditMinor(index)}
                onRemove={() => handleRemoveMinor(index)}
                calculateAge={calculateAge}
                formatIdType={formatIdType}
                formatRelationship={formatRelationship}
                getEPSDisplayLabel={getEPSDisplayLabel}
              />
            );
          })}
        </div>
      )}

      {/* Estado vacío */}
      {fields.length === 0 && (
        <div 
          onClick={handleAddMinor}
          className="text-center py-8 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-900/30 cursor-pointer hover:border-neon-green/50 hover:bg-gray-900/50 transition-all group"
        >
          <Baby className="w-10 h-10 text-gray-600 mx-auto mb-2 group-hover:text-neon-green/50 transition-colors" />
          <p className="text-gray-500 text-sm">
            No has agregado menores aún
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Toca aquí o el botón &quot;Agregar Menor&quot; para comenzar
          </p>
        </div>
      )}

      {/* Modal de Formulario */}
      <MinorFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMinor}
        initialData={getEditingMinorData()}
        minorNumber={editingIndex !== null ? editingIndex + 1 : fields.length + 1}
      />
    </section>
  );
}

/* ========================================
   Tarjeta Compacta de Menor
======================================== */

interface MinorCompactCardProps {
  index: number;
  minor: Minor;
  onEdit: () => void;
  onRemove: () => void;
  calculateAge: (birthDate: string) => string;
  formatIdType: (type: string) => string;
  formatRelationship: (rel: string) => string;
  getEPSDisplayLabel: (eps: string) => string;
}

function MinorCompactCard({
  index,
  minor,
  onEdit,
  onRemove,
  calculateAge,
  formatIdType,
  formatRelationship,
  getEPSDisplayLabel,
}: MinorCompactCardProps) {
  const fullName = `${minor.firstName} ${minor.lastName}`.trim() || "Sin nombre";
  const age = calculateAge(minor.birthDate);
  const docInfo = minor.idNumber ? `${formatIdType(minor.idType)} ${minor.idNumber}` : "Sin documento";
  const relationship = formatRelationship(minor.relationship);
  const eps = getEPSDisplayLabel(minor.eps);
  const hasMedicalCondition = minor.medicalCondition && minor.medicalCondition.trim().length > 0;

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
      <div className="flex items-center gap-3 p-3">
        {/* Avatar/Número */}
        <div className="w-10 h-10 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0">
          <span className="text-neon-green font-bold text-sm">{index + 1}</span>
        </div>

        {/* Info Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium text-sm truncate">
              {fullName}
            </h3>
            {hasMedicalCondition && (
              <span title="Tiene condición médica">
                <Heart size={12} className="text-red-400 flex-shrink-0" />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
            {age && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {age}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CreditCard size={10} />
              {docInfo}
            </span>
            <span className="flex items-center gap-1">
              <User size={10} />
              {relationship}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            EPS: {eps}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
            title="Editar menor"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            title="Eliminar menor"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
