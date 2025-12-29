"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/kiosk/LanguageToggle";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

interface KioskLayoutProps {
	children: ReactNode;
}

/**
 * Contenido interno del layout que usa el contexto de idioma
 */
function KioskLayoutContent({ children }: { children: ReactNode }) {
	const { t } = useLanguage();

	return (
		<div className="kiosk-bg min-h-screen text-foreground">
			{/* Botón de idioma flotante - esquina inferior izquierda */}
			<div className="fixed bottom-4 left-4 z-50">
				<LanguageToggle />
			</div>

			<div className="kiosk-content flex min-h-screen flex-col">
				<header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
					<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.4em] uppercase text-foreground/70">
						<span className="text-primary">Jumping</span>
						<span>{t("layout.brand")}</span>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-foreground/60">
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
		<LanguageProvider>
			<KioskLayoutContent>{children}</KioskLayoutContent>
		</LanguageProvider>
	);
}
