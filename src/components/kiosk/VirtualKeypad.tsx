'use client';

import { Check, Delete } from "lucide-react";
import { useUISound } from "@/hooks";

interface VirtualKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onClear?: () => void;
  isLoading?: boolean;
}

const digitKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const baseButtonStyles =
  "h-24 rounded-3xl border border-white/10 bg-white/5 text-4xl font-semibold text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

export function VirtualKeypad({ onKeyPress, onDelete, onConfirm, onClear, isLoading = false }: VirtualKeypadProps) {
  // Hook de sonidos para feedback táctil auditivo
  const { playClick, playError, playSuccess } = useUISound();

  /**
   * Handler para presionar un dígito con feedback sonoro
   */
  const handleKeyPress = (digit: string) => {
    playClick();
    onKeyPress(digit);
  };

  /**
   * Handler para borrar con feedback sonoro
   */
  const handleDelete = () => {
    playClick();
    onDelete();
  };

  /**
   * Handler para limpiar todo con feedback de "destrucción"
   */
  const handleClear = () => {
    playError();
    onClear?.();
  };

  /**
   * Handler para confirmar con feedback de éxito
   */
  const handleConfirm = () => {
    playSuccess();
    onConfirm();
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="grid grid-cols-3 gap-4">
        {digitKeys.slice(0, 9).map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleKeyPress(digit)}
            disabled={isLoading}
            className={`${baseButtonStyles} bg-white/10 backdrop-blur-sm`}
            aria-label={`Ingresar ${digit}`}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading}
          className={`${baseButtonStyles} col-span-1 flex items-center justify-center text-3xl text-primary`}
          aria-label="Borrar último dígito"
        >
          <Delete className="h-12 w-12" />
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress("0")}
          disabled={isLoading}
          className={`${baseButtonStyles} bg-white/10 backdrop-blur-sm`}
          aria-label="Ingresar 0"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={`${baseButtonStyles} flex items-center justify-center bg-linear-to-r from-primary to-[#b56cff] text-[#050505]`}
          aria-label="Confirmar cédula"
        >
          <span className="flex items-center gap-2 text-3xl font-bold">
            OK
            <Check className="h-10 w-10" strokeWidth={2.25} />
          </span>
        </button>
      </div>
      
      {/* Botón de limpiar (opcional) */}
      {onClear && (
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="mt-4 w-full py-3 text-sm text-gray-400 hover:text-red-400 transition-colors"
          aria-label="Limpiar todo"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
