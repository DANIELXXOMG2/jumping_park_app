"use client";

import { Home, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { KioskSessionRestorer } from "@/components/kiosk/KioskSessionRestorer";
import { LanguageToggle } from "@/components/kiosk/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useKioskStore } from "@/store/kioskStore";

interface KioskLayoutProps {
	children: ReactNode;
}

/**
 * Contenido interno del layout que usa el contexto de idioma
 */
function KioskLayoutContent({ children }: { children: ReactNode }) {
	const { t } = useLanguage();
	const router = useRouter();
	const clearSession = useKioskStore((state) => state.clearSession);

	/**
	 * Handler para volver al inicio
	 * Limpia toda la sesión del kiosko y redirige al home
	 */
	const handleGoHome = () => {
		clearSession();
		router.push("/");
	};

	return (
		<div className="kiosk-bg min-h-screen text-white">
			{/* Restaurador de sesión - invisible, maneja la lógica de persistencia */}
			<KioskSessionRestorer />
			
			{/* Botón de idioma flotante - esquina inferior izquierda */}
			<div className="fixed bottom-4 left-4 z-50">
				<LanguageToggle />
			</div>

			<div className="kiosk-content flex min-h-screen flex-col">
				<header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
					{/* Botón Home Premium */}
					<button
						type="button"
						onClick={handleGoHome}
						className="group relative flex items-center gap-2 overflow-hidden rounded-full
							border-2 border-white/20 dark:border-zinc-300/30
							bg-gradient-to-r from-white/10 via-white/5 to-white/10
							dark:from-white dark:via-zinc-50 dark:to-white
							px-4 py-2 text-xs font-semibold tracking-[0.3em] uppercase
							text-white/80 dark:text-black
							shadow-[0_4px_20px_rgba(0,0,0,0.15)]
							transition-all duration-300
							hover:shadow-[0_6px_25px_rgba(46,204,113,0.3)] hover:border-primary/40
							hover:scale-[1.02] active:scale-[0.98]"
						aria-label={t("layout.homeButton") || "Volver al inicio"}
					>
						{/* Shimmer effect */}
						<span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden="true" />
						
						{/* Icono Home */}
						<Home className="relative w-4 h-4 text-primary dark:text-black group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
						
						{/* Texto de marca */}
						<span className="relative text-primary dark:text-black">Jumping</span>
						<span className="relative dark:text-black">{t("layout.brand")}</span>
						
						{/* Sparkle decorativo */}
						<Sparkles className="relative w-3 h-3 text-primary/60 dark:text-black/60 group-hover:text-primary dark:group-hover:text-black group-hover:rotate-12 transition-all duration-300" strokeWidth={2} />
					</button>
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-white/60">
							{t("layout.subtitle")}
						</span>
						<ThemeToggle />
					</div>
				</header>
				<main className="flex flex-1 flex-col px-4 sm:px-8">{children}</main>
			</div>
		</div>
	);
}

export default function KioskLayout({ children }: KioskLayoutProps) {
	return (
		<AuthProvider>
			<LanguageProvider>
				<KioskLayoutContent>{children}</KioskLayoutContent>
			</LanguageProvider>
		</AuthProvider>
	);
}
