import type { Metadata } from "next";
import {
	APP_NAME,
	buildPageFreshnessMetadata,
	createCanonicalUrl,
	INDEXABLE_ROBOTS,
} from "@/lib/seo";

export const LANDING_PAGE_TITLE =
	"Jumping Park - Parque de Trampolines en Villavicencio | Centro Comercial Primavera Urbana";
export const LANDING_PAGE_DESCRIPTION =
	"Jumping Park es el parque de trampolines de Villavicencio ubicado en el Centro Comercial Primavera Urbana (Locales 313-317). Diversión segura para todas las edades. Lunes a viernes 1:30pm-8pm, sábados y domingos 11am-8pm. Tel: 312 2594245.";
export const LANDING_OPEN_GRAPH_IMAGE_PATH = "/opengraph-image";
export const LANDING_OPEN_GRAPH_IMAGE_URL = createCanonicalUrl(
	LANDING_OPEN_GRAPH_IMAGE_PATH,
);
export const LANDING_OPEN_GRAPH_ALT = `${APP_NAME} | Parque de Trampolines en Villavicencio`;

export function buildLandingMetadata(): Metadata {
	return {
		robots: INDEXABLE_ROBOTS,
		title: LANDING_PAGE_TITLE,
		description: LANDING_PAGE_DESCRIPTION,
		alternates: {
			canonical: "/",
		},
		openGraph: {
			title: LANDING_PAGE_TITLE,
			description: LANDING_PAGE_DESCRIPTION,
			url: createCanonicalUrl("/"),
			type: "website",
			...buildPageFreshnessMetadata(),
			images: [
				{
					url: LANDING_OPEN_GRAPH_IMAGE_URL,
					width: 1200,
					height: 630,
					alt: LANDING_OPEN_GRAPH_ALT,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: LANDING_PAGE_TITLE,
			description: LANDING_PAGE_DESCRIPTION,
			images: [LANDING_OPEN_GRAPH_IMAGE_URL],
		},
	};
}
