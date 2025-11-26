'use client';

import { Check, Delete } from "lucide-react";

interface VirtualKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const digitKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const baseButtonStyles =
  "h-24 rounded-3xl border border-white/10 bg-white/5 text-4xl font-semibold text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

export function VirtualKeypad({ onKeyPress, onDelete, onConfirm, isLoading = false }: VirtualKeypadProps) {
  return (
    <div className="w-full max-w-3xl">
      <div className="grid grid-cols-3 gap-4">
        {digitKeys.slice(0, 9).map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => onKeyPress(digit)}
            disabled={isLoading}
            className={`${baseButtonStyles} bg-white/10 backdrop-blur-sm`}
            aria-label={`Ingresar ${digit}`}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={onDelete}
          disabled={isLoading}
          className={`${baseButtonStyles} col-span-1 flex items-center justify-center text-3xl text-primary`}
          aria-label="Borrar último dígito"
        >
          <Delete className="h-12 w-12" />
        </button>
        <button
          type="button"
          onClick={() => onKeyPress("0")}
          disabled={isLoading}
          className={`${baseButtonStyles} bg-white/10 backdrop-blur-sm`}
          aria-label="Ingresar 0"
        >
          0
        </button>
        <button
          type="button"
          onClick={onConfirm}
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
    </div>
  );
}
