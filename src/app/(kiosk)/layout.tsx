"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/kiosk/LanguageToggle";
import { LanguageProvider } from "@/contexts/LanguageContext";

interface KioskLayoutProps {
	children: ReactNode;
}

export default function KioskLayout({ children }: KioskLayoutProps) {
	return (
		<LanguageProvider>
			<div className="kiosk-bg min-h-screen text-foreground">
				{/* Botón de idioma flotante - esquina superior izquierda */}
				<div className="fixed top-4 left-4 z-50">
					<LanguageToggle />
				</div>

				<div className="kiosk-content flex min-h-screen flex-col">
					<header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6">
						<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.4em] uppercase text-foreground/70">
							<span className="text-primary">Jumping</span>
							<span>Park</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-foreground/60">
								Kiosko de Registro
							</span>
							<ThemeToggle />
						</div>
					</header>
					<main className="flex flex-1 flex-col px-4 sm:px-8">{children}</main>
				</div>
			</div>
		</LanguageProvider>
	);
}
