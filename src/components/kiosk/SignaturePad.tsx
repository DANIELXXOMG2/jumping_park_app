"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";

interface SignaturePadProps {
  onEnd?: () => void;
}

export interface SignaturePadRef {
  isEmpty: () => boolean;
  getTrimmedCanvas: () => HTMLCanvasElement;
  toDataURL: () => string;
  clear: () => void;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onEnd }, ref) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    isEmpty: () => sigCanvas.current?.isEmpty() ?? true,
    getTrimmedCanvas: () => sigCanvas.current?.getTrimmedCanvas() as HTMLCanvasElement,
    /**
     * Retorna la firma como base64 PNG optimizado.
     * Usa getTrimmedCanvas() para eliminar espacios vacíos y reducir tamaño.
     * Típicamente reduce el tamaño de ~50KB a ~5-15KB.
     */
    toDataURL: () => {
      if (!sigCanvas.current) return "";
      // Usar canvas recortado para eliminar espacios en blanco
      const trimmedCanvas = sigCanvas.current.getTrimmedCanvas();
      // PNG con calidad por defecto (PNG no soporta quality param pero el trim reduce significativamente el peso)
      return trimmedCanvas.toDataURL("image/png");
    },
    clear: () => sigCanvas.current?.clear(),
  }));

  // Handle responsive resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Maintain a reasonable aspect ratio or fixed height
        setCanvasSize({ width, height: 200 });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  return (
    <div className="relative w-full border-2 border-neon-blue/50 rounded-xl bg-white overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.1)]" ref={containerRef}>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        canvasProps={{
          width: canvasSize.width,
          height: canvasSize.height,
          className: "cursor-crosshair block",
        }}
        onEnd={onEnd}
      />
      
      <button
        type="button"
        onClick={clearSignature}
        className="absolute top-2 right-2 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors z-10"
        title="Limpiar firma"
      >
        <Eraser size={18} />
      </button>
      
      <div className="absolute bottom-2 left-4 text-xs text-gray-400 pointer-events-none select-none">
        Firme aquí
      </div>
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
