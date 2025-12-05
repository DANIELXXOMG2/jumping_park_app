"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";

interface ConsentReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ConsentReadingModal({
  isOpen,
  onClose,
  children,
}: ConsentReadingModalProps) {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
            duration: 0.4,
          }}
        >
          {/* Header fijo */}
          <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              📄 Consentimiento Completo
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </header>

          {/* Contenido scrolleable */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28">
            <div className="max-w-3xl mx-auto text-gray-900 dark:text-gray-100 font-sans text-lg sm:text-xl leading-relaxed">
              {children}
            </div>
          </main>

          {/* Botón fijo en la parte inferior */}
          <div className="sticky bottom-0 z-10 p-4 bg-linear-to-t from-white via-white dark:from-gray-950 dark:via-gray-950">
            <div className="max-w-3xl mx-auto">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-[#00E5FF] hover:bg-[#00B8D4] text-black font-bold text-xl rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/30"
              >
                <ArrowLeft className="w-6 h-6" />
                Cerrar y Volver a Firmar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
