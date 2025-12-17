"use client";

import { RefreshCw, WifiOff } from "lucide-react";

export default function OfflinePage() {
	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
				{/* Icono */}
				<div className="mb-6 flex justify-center">
					<div className="p-4 bg-red-500/20 rounded-full">
						<WifiOff className="w-16 h-16 text-red-400" strokeWidth={1.5} />
					</div>
				</div>

				{/* Título */}
				<h1 className="text-2xl font-bold text-white mb-3">
					Sin conexión a Internet
				</h1>

				{/* Mensaje */}
				<p className="text-slate-400 mb-8 leading-relaxed">
					No tienes conexión a internet. Revisa tu conexión para continuar o
					intenta recargar la página.
				</p>

				{/* Botón de recarga */}
				<button
					type="button"
					onClick={handleReload}
					className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
				>
					<RefreshCw className="w-5 h-5" />
					Recargar página
				</button>

				{/* Indicador de estado */}
				<div className="mt-8 pt-6 border-t border-slate-700">
					<div className="flex items-center justify-center gap-2 text-sm text-slate-500">
						<span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
						Modo offline activo
					</div>
				</div>
			</div>
		</div>
	);
}
