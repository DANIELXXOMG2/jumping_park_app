"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ModalVariant = "dialog" | "fullscreen";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

interface DialogModalProps extends BaseModalProps {
  variant?: "dialog";
}

interface FullscreenModalProps extends BaseModalProps {
  variant: "fullscreen";
  /** Contenido del botón de acción inferior (solo fullscreen) */
  footerAction?: ReactNode;
}

type ModalProps = DialogModalProps | FullscreenModalProps;

/**
 * Componente Modal unificado.
 * 
 * @variant "dialog" - Modal centrado estilo admin (default)
 * @variant "fullscreen" - Modal pantalla completa estilo kiosko
 * 
 * @example
 * // Dialog (admin)
 * <Modal isOpen={open} onClose={close} title="Editar">
 *   <form>...</form>
 * </Modal>
 * 
 * // Fullscreen (kiosk)
 * <Modal 
 *   variant="fullscreen" 
 *   isOpen={open} 
 *   onClose={close}
 *   title="📄 Consentimiento"
 *   footerAction={<button>Cerrar</button>}
 * >
 *   <p>Contenido largo...</p>
 * </Modal>
 */
export function Modal(props: ModalProps) {
  const { isOpen, onClose, children, title, className, variant = "dialog" } = props;

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

  if (variant === "fullscreen") {
    const { footerAction } = props as FullscreenModalProps;
    
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              "fixed inset-0 z-100 flex flex-col bg-white dark:bg-gray-950",
              className
            )}
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
              {title && (
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
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

            {/* Footer con acción (opcional) */}
            {footerAction && (
              <div className="sticky bottom-0 z-10 p-4 bg-linear-to-t from-white via-white dark:from-gray-950 dark:via-gray-950">
                <div className="max-w-3xl mx-auto">
                  {footerAction}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Variant: dialog (default - admin style)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={cn(
          "relative bg-surface rounded-2xl border border-border shadow-xl max-h-[90vh] overflow-auto",
          "w-[95vw] max-w-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-surface z-10">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-muted transition-colors min-h-0"
            >
              <X className="w-5 h-5 text-foreground/60" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
