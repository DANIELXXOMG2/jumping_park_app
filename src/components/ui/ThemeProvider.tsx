"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Proveedor de tema para Dark Mode.
 * Envuelve la aplicación y persiste la preferencia del usuario.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}
