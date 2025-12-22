"use client";

import { ArrowRight, CheckCircle2, PartyPopper } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useKioskStore } from "@/store/kioskStore";

/**
 * Componente interno que contiene la lógica de useSearchParams y el renderizado visual.
 */
function ExitoContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { resetFlow } = useKioskStore();
	const [countdown, setCountdown] = useState(8);

	const consecutivo = searchParams.get("consecutivo") || "---";
	const nombre = searchParams.get("nombre") || "Visitante";

	useEffect(() => {
		// Limpiar el estado del kiosko inmediatamente
		resetFlow();

		// Countdown para volver al inicio
		const interval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					router.push("/ingreso");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [resetFlow, router]);

	const handleContinue = () => {
		router.push("/ingreso");
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-6">
			{/* Círculo animado de éxito */}
			<div className="relative mb-8">
				<div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
				<div className="relative bg-linear-to-br from-green-400 to-green-600 rounded-full p-8 shadow-[0_0_60px_rgba(34,197,94,0.5)]">
					<CheckCircle2 size={80} className="text-white" strokeWidth={1.5} />
				</div>
			</div>

			{/* Mensaje principal */}
			<div className="text-center max-w-md">
				<div className="flex items-center justify-center gap-2 mb-4">
					<PartyPopper className="text-yellow-400" size={28} />
					<h1 className="text-3xl font-bold text-white">¡Registro Exitoso!</h1>
					<PartyPopper className="text-yellow-400 scale-x-[-1]" size={28} />
				</div>

				<p className="text-gray-400 text-lg mb-6">
					Gracias por completar el registro,{" "}
					<span className="text-neon-blue font-semibold">{nombre}</span>
				</p>

				{/* Número de consecutivo */}
				<div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8">
					<p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
						Tu número de registro
					</p>
					<div className="flex items-center justify-center gap-2">
						<span className="text-5xl font-bold bg-linear-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">
							#{consecutivo}
						</span>
					</div>
					<p className="text-gray-500 text-sm mt-3">
						Consentimiento guardado exitosamente
					</p>
				</div>

				{/* Mensaje de instrucción */}
				<div className="bg-neon-blue/10 border border-neon-blue/30 rounded-xl p-4 mb-8">
					<p className="text-neon-blue font-medium">
						¡Ya puedes pasar a las atracciones! 🎉
					</p>
					<p className="text-gray-400 text-sm mt-1">
						No olvides revisar las reglas del parque
					</p>
				</div>

				{/* Botón de continuar */}
				<button
					type="button"
					onClick={handleContinue}
					className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-700"
				>
					<span>Volver al Inicio</span>
					<ArrowRight size={20} />
				</button>

				{/* Countdown */}
				<p className="text-gray-600 text-sm mt-4">
					Regresando automáticamente en{" "}
					<span className="text-gray-400 font-mono">{countdown}s</span>
				</p>
			</div>

			{/* Decoración de fondo */}
			<div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-green-500/50 to-transparent" />
		</div>
	);
}

/**
 * Página de Éxito - Se muestra después de completar el consentimiento.
 * Proporciona feedback visual positivo antes de volver al inicio.
 */
export default function ExitoPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center text-white">
					Cargando...
				</div>
			}
		>
			<ExitoContent />
		</Suspense>
	);
}
