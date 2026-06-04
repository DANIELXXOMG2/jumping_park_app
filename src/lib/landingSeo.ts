import type { Metadata } from "next";
import {
	APP_NAME,
	buildPageFreshnessMetadata,
	createCanonicalUrl,
} from "@/lib/seo";

export const LANDING_PAGE_TITLE =
	"Jumping Park - Parque de Trampolines en Villavicencio";
export const LANDING_PAGE_DESCRIPTION =
	"Jumping Park es el parque de trampolines más grande de Villavicencio. Diversión segura para todas las edades con más de 50 camas elásticas, piscina de espuma, muro de escalada y zona infantil.";
export const LANDING_OPEN_GRAPH_IMAGE_PATH = "/opengraph-image";
export const LANDING_OPEN_GRAPH_IMAGE_URL = createCanonicalUrl(
	LANDING_OPEN_GRAPH_IMAGE_PATH,
);
export const LANDING_OPEN_GRAPH_ALT = `${APP_NAME} | Parque de Trampolines`;

export function buildLandingMetadata(): Metadata {
	return {
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
