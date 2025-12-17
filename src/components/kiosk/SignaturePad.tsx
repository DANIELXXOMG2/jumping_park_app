"use client";

import { Eraser } from "lucide-react";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import SignatureCanvas from "react-signature-canvas";
import { useUISound } from "@/hooks";

/**
 * Calcula la altura óptima del canvas basándose en el ancho.
 * Mantiene una relación de aspecto ~2.5:1 para firmas naturales.
 * Mínimo 150px, máximo 250px para tablets.
 */
const calculateOptimalHeight = (width: number): number => {
	const aspectRatio = 2.5; // Relación ancho:alto ideal para firmas
	const calculatedHeight = Math.round(width / aspectRatio);
	// Limitar entre 150px y 250px para mejor UX en tablets
	return Math.max(150, Math.min(250, calculatedHeight));
};

interface SignaturePadProps {
	onEnd?: () => void;
}

export interface SignaturePadRef {
	isEmpty: () => boolean;
	getTrimmedCanvas: () => HTMLCanvasElement;
	toDataURL: () => string;
	clear: () => void;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
	({ onEnd }, ref) => {
		const sigCanvas = useRef<SignatureCanvas>(null);
		const containerRef = useRef<HTMLDivElement>(null);
		const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });

		// Hook de sonidos para feedback auditivo
		const { playClick } = useUISound();

		// Expose methods to parent
		useImperativeHandle(ref, () => ({
			isEmpty: () => sigCanvas.current?.isEmpty() ?? true,
			getTrimmedCanvas: () =>
				sigCanvas.current?.getTrimmedCanvas() as HTMLCanvasElement,
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

		// Handle responsive resize con debounce para evitar parpadeos
		useEffect(() => {
			let timeoutId: ReturnType<typeof setTimeout>;

			const resizeCanvas = () => {
				if (containerRef.current) {
					const { width } = containerRef.current.getBoundingClientRect();
					// Evitar re-renders innecesarios si el cambio es mínimo
					const newHeight = calculateOptimalHeight(width);
					setCanvasSize((prev) => {
						if (
							Math.abs(prev.width - width) > 5 ||
							Math.abs(prev.height - newHeight) > 5
						) {
							return { width, height: newHeight };
						}
						return prev;
					});
				}
			};

			// Resize inicial
			resizeCanvas();

			// Debounce del resize para evitar renders excesivos
			const handleResize = () => {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(resizeCanvas, 100);
			};

			window.addEventListener("resize", handleResize);
			return () => {
				window.removeEventListener("resize", handleResize);
				clearTimeout(timeoutId);
			};
		}, []);

		/**
		 * Handler para limpiar firma con feedback sonoro
		 */
		const clearSignature = () => {
			playClick();
			sigCanvas.current?.clear();
		};

		/**
		 * Handler para cuando termina de firmar (onEnd del canvas)
		 * Sonido muy sutil al completar un trazo
		 */
		const handleSignatureEnd = () => {
			// Llamar al callback del padre si existe
			onEnd?.();
			// Nota: Decidimos NO reproducir sonido aquí para no interrumpir
			// el flujo natural de la firma. El usuario puede hacer múltiples trazos.
		};

		return (
			<div
				className="relative w-full border-2 border-neon-blue/50 rounded-xl bg-white overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.1)]"
				ref={containerRef}
			>
				<SignatureCanvas
					ref={sigCanvas}
					penColor="black"
					canvasProps={{
						width: canvasSize.width,
						height: canvasSize.height,
						className: "cursor-crosshair block",
					}}
					onEnd={handleSignatureEnd}
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
	},
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
