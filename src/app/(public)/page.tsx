import { HomepageShell } from "@/components/kiosk/HomepageShell";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { createServerTranslator } from "@/lib/i18n/serverTranslate";
import { buildLandingMetadata } from "@/lib/landingSeo";
import { buildPublicPageStructuredData } from "@/lib/seo";

export const metadata = buildLandingMetadata();

export default async function LandingPage() {
	const { t, locale } = await createServerTranslator();

	const structuredData = buildPublicPageStructuredData({
		pathname: "/",
		title: "Jumping Park - Parque de Trampolines en Villavicencio",
		description:
			"Jumping Park es el parque de trampolines de Villavicencio ubicado en el Centro Comercial Primavera Urbana. Diversión segura para todas las edades.",
	});

	return (
		<LanguageProvider initialLanguage={locale}>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-rendered static data
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>
			<HomepageShell t={t} locale={locale} />
		</LanguageProvider>
	);
}
