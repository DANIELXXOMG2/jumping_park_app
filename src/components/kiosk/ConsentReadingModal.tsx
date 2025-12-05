"use client";

import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

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
  return (
    <Modal
      variant="fullscreen"
      isOpen={isOpen}
      onClose={onClose}
      title="📄 Consentimiento Completo"
      footerAction={
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-[#00E5FF] hover:bg-[#00B8D4] text-black font-bold text-xl rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/30"
        >
          <ArrowLeft className="w-6 h-6" />
          Cerrar y Volver a Firmar
        </button>
      }
    >
      {children}
    </Modal>
  );
}
