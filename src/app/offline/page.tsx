"use client";

import { Home, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-background via-background to-background/90 flex items-center justify-center p-4 sm:p-6">
			{/* ═══ PARTÍCULAS DECORATIVAS DE FONDO ═══ */}
			<div
				className="fixed inset-0 pointer-events-none overflow-hidden"
				aria-hidden="true"
			>
				<span className="absolute top-[10%] left-[15%] w-2 h-2 rounded-full bg-red-500/20 animate-pulse" />
				<span className="absolute top-[25%] right-[20%] w-3 h-3 rounded-full bg-orange-500/15 animate-pulse delay-300" />
				<span className="absolute bottom-[30%] left-[25%] w-1.5 h-1.5 rounded-full bg-red-500/25 animate-pulse delay-500" />
				<span className="absolute bottom-[15%] right-[15%] w-2.5 h-2.5 rounded-full bg-orange-500/20 animate-pulse delay-700" />
			</div>

			{/* ═══ TARJETA PRINCIPAL ═══ */}
			<div
				className="group/card relative max-w-md w-full overflow-hidden rounded-2xl sm:rounded-3xl
				bg-linear-to-br from-white/10 via-white/5 to-white/10
				dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
				border-2 border-white/20 dark:border-zinc-700/50
				p-6 sm:p-8 text-center
				shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg"
			>
				{/* Shimmer de fondo */}
				<div
					className="absolute inset-0 bg-linear-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 pointer-events-none"
					aria-hidden="true"
				/>

				{/* ═══ ÍCONO ANIMADO ═══ */}
				<div className="relative mb-6 flex justify-center">
					{/* Glow pulsante */}
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-24 h-24 rounded-full bg-red-500/20 blur-xl animate-pulse" />
					</div>

					{/* Contenedor del ícono */}
					<div
						className="relative p-5 rounded-full 
						bg-linear-to-br from-red-500/20 via-red-500/10 to-orange-500/20 
						border-2 border-red-500/30
						shadow-[0_0_30px_rgba(239,68,68,0.3)]
						group-hover/card:shadow-[0_0_40px_rgba(239,68,68,0.4)]
						transition-all duration-500"
					>
						<WifiOff
							className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 
								group-hover/card:rotate-12 transition-transform duration-500"
							strokeWidth={1.5}
						/>
					</div>
				</div>

				{/* ═══ TÍTULO ═══ */}
				<h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
					Sin conexión a Internet
				</h1>

				{/* ═══ MENSAJE ═══ */}
				<p className="text-foreground/70 mb-8 leading-relaxed text-sm sm:text-base">
					No tienes conexión a internet. Revisa tu conexión para continuar o
					intenta recargar la página.
				</p>

				{/* ═══ BOTONES PREMIUM ═══ */}
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					{/* Botón Volver al Inicio */}
					<Link
						href="/"
						className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5
							bg-linear-to-br from-white/10 via-white/5 to-white/10
							dark:from-zinc-800/90 dark:via-zinc-900/80 dark:to-zinc-800/90
							text-foreground font-semibold rounded-xl sm:rounded-2xl
							border-2 border-white/20 dark:border-zinc-700/50
							shadow-[0_8px_30px_rgba(0,0,0,0.2)]
							transition-all duration-300
							hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:scale-[1.02] hover:border-primary/30
							active:scale-[0.98]"
					>
						<span
							className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
							aria-hidden="true"
						/>
						<Home className="relative w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-300" />
						<span className="relative">Volver al Inicio</span>
					</Link>

					{/* Botón de recarga */}
					<button
						type="button"
						onClick={handleReload}
						className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5
							bg-linear-to-r from-primary via-emerald-400 to-primary
							text-zinc-900 font-semibold rounded-xl sm:rounded-2xl
							border-2 border-white/30
							shadow-[0_8px_30px_rgba(46,204,113,0.4)]
							transition-all duration-300
							hover:shadow-[0_12px_40px_rgba(46,204,113,0.5)] hover:scale-[1.02]
							active:scale-[0.98]"
					>
						<span
							className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
							aria-hidden="true"
						/>
						<RefreshCw className="relative w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
						<span className="relative">Recargar página</span>
					</button>
				</div>

				{/* ═══ INDICADOR DE ESTADO ═══ */}
				<div className="mt-8 pt-6 border-t border-white/10 dark:border-zinc-700/50">
					<div
						className="inline-flex items-center gap-2 px-4 py-2 rounded-full
						bg-linear-to-r from-red-500/10 via-red-500/5 to-red-500/10
						border border-red-500/20"
					>
						<span className="relative flex h-2.5 w-2.5">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
						</span>
						<span className="text-sm font-medium text-red-400">
							Modo offline activo
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
