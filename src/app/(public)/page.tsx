import Script from "next/script";
import { HomepageExperience } from "@/components/kiosk/HomepageExperience";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { buildLandingMetadata } from "@/lib/landingSeo";
import { buildPublicPageStructuredData } from "@/lib/seo";

export const metadata = buildLandingMetadata();

export default function LandingPage() {
	const structuredData = buildPublicPageStructuredData({
		pathname: "/",
		title: "Jumping Park - Parque de Trampolines en Villavicencio",
		description:
			"Jumping Park es el parque de trampolines de Villavicencio ubicado en el Centro Comercial Primavera Urbana. Diversión segura para todas las edades.",
	});

	return (
		<LanguageProvider>
			<Script
				id="landing-jsonld"
				type="application/ld+json"
				strategy="afterInteractive"
			>
				{JSON.stringify(structuredData)}
			</Script>
			<HomepageExperience />
		</LanguageProvider>
	);
}
