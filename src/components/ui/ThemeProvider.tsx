"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Proveedor de tema para Dark Mode.
 * Dark mode es el tema predeterminado. El usuario puede cambiar a light mode con el switch.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={false}
			disableTransitionOnChange
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}
