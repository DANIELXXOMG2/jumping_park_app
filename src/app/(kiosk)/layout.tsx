import type { Metadata, Viewport } from "next";
import { KioskLayoutShell } from "@/components/layouts/KioskLayoutShell";
import { resolveKioskHardeningFlags } from "@/lib/hardeningPolicy";
import { NON_INDEXABLE_ROBOTS } from "@/lib/seo";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata: Metadata = {
	robots: NON_INDEXABLE_ROBOTS,
};

export default function KioskLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<KioskLayoutShell hardeningFlags={resolveKioskHardeningFlags()}>
			{children}
		</KioskLayoutShell>
	);
}
