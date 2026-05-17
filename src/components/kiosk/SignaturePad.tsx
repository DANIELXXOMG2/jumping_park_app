"use client";

import { Eraser } from "lucide-react";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import SignatureCanvas, {
	type SignatureCanvasProps,
} from "react-signature-canvas";
import { useUISound } from "@/hooks";

const getAlpha = (
	imageData: Uint8ClampedArray,
	imageWidth: number,
	x: number,
	y: number,
): number => imageData[(imageWidth * y + x) * 4 + 3];

const scanY = (
	fromTop: boolean,
	imageWidth: number,
	imageHeight: number,
	imageData: Uint8ClampedArray,
): number | null => {
	const offset = fromTop ? 1 : -1;
	const firstRow = fromTop ? 0 : imageHeight - 1;

	for (let y = firstRow; fromTop ? y < imageHeight : y > -1; y += offset) {
		for (let x = 0; x < imageWidth; x += 1) {
			if (getAlpha(imageData, imageWidth, x, y) > 0) {
				return y;
			}
		}
	}

	return null;
};

const scanX = (
	fromLeft: boolean,
	imageWidth: number,
	imageHeight: number,
	imageData: Uint8ClampedArray,
): number | null => {
	const offset = fromLeft ? 1 : -1;
	const firstColumn = fromLeft ? 0 : imageWidth - 1;

	for (let x = firstColumn; fromLeft ? x < imageWidth : x > -1; x += offset) {
		for (let y = 0; y < imageHeight; y += 1) {
			if (getAlpha(imageData, imageWidth, x, y) > 0) {
				return x;
			}
		}
	}

	return null;
};

const trimCanvasForSignature = (
	sourceCanvas: HTMLCanvasElement,
): HTMLCanvasElement => {
	const copy = document.createElement("canvas");
	copy.width = sourceCanvas.width;
	copy.height = sourceCanvas.height;

	const seededContext = copy.getContext("2d", { willReadFrequently: true });
	if (!seededContext) {
		return copy;
	}

	seededContext.drawImage(sourceCanvas, 0, 0);

	const imageData = seededContext.getImageData(0, 0, copy.width, copy.height).data;
	const top = scanY(true, copy.width, copy.height, imageData);
	const bottom = scanY(false, copy.width, copy.height, imageData);
	const left = scanX(true, copy.width, copy.height, imageData);
	const right = scanX(false, copy.width, copy.height, imageData);

	if (
		top === null ||
		bottom === null ||
		left === null ||
		right === null
	) {
		return copy;
	}

	const trimmedWidth = right - left + 1;
	const trimmedHeight = bottom - top + 1;
	const trimmedData = seededContext.getImageData(
		left,
		top,
		trimmedWidth,
		trimmedHeight,
	);

	copy.width = trimmedWidth;
	copy.height = trimmedHeight;

	copy
		.getContext("2d", { willReadFrequently: true })
		?.putImageData(trimmedData, 0, 0);

	return copy;
};

class SignatureCanvasFixed extends SignatureCanvas {
	constructor(props: SignatureCanvasProps) {
		super(props);

		const originalComponentDidMount = this.componentDidMount;

		this.componentDidMount = () => {
			this.getCanvas().getContext("2d", { willReadFrequently: true });
			originalComponentDidMount?.();
		};
	}
}

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

		const getTrimmedSignatureCanvas = (): HTMLCanvasElement => {
			if (!sigCanvas.current) {
				return document.createElement("canvas");
			}

			return trimCanvasForSignature(sigCanvas.current.getCanvas());
		};

		// Hook de sonidos para feedback auditivo
		const { playClick } = useUISound();

		// Expose methods to parent
		useImperativeHandle(ref, () => ({
			isEmpty: () => sigCanvas.current?.isEmpty() ?? true,
			getTrimmedCanvas: getTrimmedSignatureCanvas,
			/**
			 * Retorna la firma como base64 PNG optimizado.
			 * Usa getTrimmedCanvas() para eliminar espacios vacíos y reducir tamaño.
			 * Típicamente reduce el tamaño de ~50KB a ~5-15KB.
			 */
			toDataURL: () => {
				if (!sigCanvas.current) return "";
				// Usar canvas recortado para eliminar espacios en blanco
				const trimmedCanvas = getTrimmedSignatureCanvas();
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
				className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden
					/* Fondo con gradiente sutil */
					bg-gradient-to-br from-white via-gray-50 to-white
					/* Borde premium */
					border-2 border-blue-400/40 
					/* Sombra con glow */
					shadow-[0_4px_24px_rgba(52,152,219,0.15),inset_0_1px_0_rgba(255,255,255,0.5)]
					/* Transiciones */
					transition-all duration-300
					/* Hover */
					hover:border-blue-500/60 hover:shadow-[0_8px_32px_rgba(52,152,219,0.2)]
					/* Focus within */
					focus-within:border-blue-500/70 focus-within:shadow-[0_0_40px_rgba(52,152,219,0.2),0_12px_40px_rgba(52,152,219,0.15)]
					focus-within:ring-4 focus-within:ring-blue-500/15"
				ref={containerRef}
			>
				<SignatureCanvasFixed
					ref={sigCanvas}
					penColor="#1e3a5f"
					canvasProps={{
						width: canvasSize.width,
						height: canvasSize.height,
						className: "cursor-crosshair block touch-none",
					}}
					onEnd={handleSignatureEnd}
				/>

				<button
					type="button"
					onClick={clearSignature}
					className="absolute top-2 right-2 p-2.5 sm:p-3
						/* Fondo glass */
						bg-white/80 backdrop-blur-sm
						/* Borde */
						border border-gray-200/50
						/* Texto y colores */
						text-gray-500
						/* Bordes redondeados */
						rounded-xl
						/* Sombra */
						shadow-md
						/* Transiciones */
						transition-all duration-200
						/* Hover */
						hover:bg-red-50 hover:text-red-500 hover:border-red-200 hover:scale-105 hover:shadow-lg
						/* Active (móvil) */
						active:scale-95
						/* Focus */
						focus:outline-none focus:ring-2 focus:ring-red-400/30
						z-10"
					title="Limpiar firma"
				>
					<Eraser size={18} />
				</button>

				{/* Línea guía para la firma */}
				<div className="absolute bottom-8 left-4 right-4 border-b border-dashed border-gray-300/60 pointer-events-none" />

				<div className="absolute bottom-2 left-4 text-xs text-gray-400 pointer-events-none select-none font-medium">
					Firme aquí ↑
				</div>
			</div>
		);
	},
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
