'use client';

import { ArrowRight, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { useKioskStore } from "@/store/kioskStore";

interface StartActionButtonProps {
  href?: string;
}

export function StartActionButton({ href = "/ingreso" }: StartActionButtonProps) {
  const router = useRouter();
  const resetFlow = useKioskStore((state) => state.resetFlow);
  const setStep = useKioskStore((state) => state.setStep);
  const [isPending, startTransition] = useTransition();

  const handlePress = useCallback(() => {
    startTransition(() => {
      resetFlow();
      setStep(1);
      router.push(href);
    });
  }, [href, resetFlow, router, setStep, startTransition]);

  return (
    <button
      type="button"
      onClick={handlePress}
      className="flex w-full max-w-2xl items-center justify-between gap-4 rounded-touch bg-linear-to-r from-primary to-[#b56cff] px-10 py-6 text-left text-2xl font-semibold uppercase tracking-wide text-[#050505] shadow-[0_20px_80px_rgba(195,255,45,0.25)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      aria-label="Comenzar registro en Jumping Park"
      disabled={isPending}
    >
      <div className="flex flex-col">
        <span>Iniciar registro / ingreso</span>
        <span className="text-base font-normal normal-case tracking-normal text-[#050505]/80">
          Tocá para validar tu identidad o escanea tu QR
        </span>
      </div>
      <div className="flex items-center gap-3 text-[#050505]">
        <QrCode className="h-8 w-8" strokeWidth={1.5} />
        <ArrowRight className="h-10 w-10" strokeWidth={1.5} />
      </div>
    </button>
  );
}
