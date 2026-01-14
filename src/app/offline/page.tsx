"use client";

import { ArrowLeft, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div
			className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4"
			style={{ minHeight: "100vh", backgroundColor: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
		>
			<div
				className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center shadow-2xl"
				style={{ maxWidth: "28rem", width: "100%", backgroundColor: "rgba(30, 41, 59, 0.8)", border: "1px solid #334155", borderRadius: "1rem", padding: "2rem", textAlign: "center" }}
			>
				{/* Icono */}
				<div className="mb-6 flex justify-center" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
					<div className="p-4 bg-red-500/20 rounded-full" style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.2)", borderRadius: "9999px" }}>
						<WifiOff className="w-16 h-16 text-red-400" style={{ width: "4rem", height: "4rem", color: "#f87171" }} strokeWidth={1.5} />
					</div>
				</div>

				{/* Título */}
				<h1 className="text-2xl font-bold text-white mb-3" style={{ fontSize: "1.5rem", fontWeight: "700", color: "#fff", marginBottom: "0.75rem" }}>
					Sin conexión a Internet
				</h1>

				{/* Mensaje */}
				<p className="text-slate-400 mb-8 leading-relaxed" style={{ color: "#94a3b8", marginBottom: "2rem", lineHeight: "1.625" }}>
					No tienes conexión a internet. Revisa tu conexión para continuar o
					intenta recargar la página.
				</p>

				{/* Botones */}
				<div className="flex flex-col sm:flex-row gap-3 justify-center" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
					{/* Botón Volver al Admin */}
					<Link
						href="/admin/usuarios"
						className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
						style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", backgroundColor: "#334155", color: "#fff", fontWeight: "500", borderRadius: "0.5rem", textDecoration: "none" }}
					>
						<ArrowLeft className="w-5 h-5" style={{ width: "1.25rem", height: "1.25rem" }} />
						Volver al Admin
					</Link>

					{/* Botón de recarga */}
					<button
						type="button"
						onClick={handleReload}
						className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
						style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", backgroundColor: "#2563eb", color: "#fff", fontWeight: "500", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
					>
						<RefreshCw className="w-5 h-5" style={{ width: "1.25rem", height: "1.25rem" }} />
						Recargar página
					</button>
				</div>

				{/* Indicador de estado */}
				<div className="mt-8 pt-6 border-t border-slate-700" style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #334155" }}>
					<div className="flex items-center justify-center gap-2 text-sm text-slate-500" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
						<span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ width: "0.5rem", height: "0.5rem", backgroundColor: "#ef4444", borderRadius: "9999px" }} />
						Modo offline activo
					</div>
				</div>
			</div>
		</div>
	);
}
