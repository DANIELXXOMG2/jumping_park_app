import type { Metadata, MetadataRoute } from "next";
import { evaluateHardeningFlag, HARDENING_FLAG } from "@/lib/hardeningPolicy";

export const APP_NAME = "Jumping Park";
export const APP_DESCRIPTION =
	"Sistema de registro y consentimiento informado para visitantes de Jumping Park. Firma digital segura y gestion de menores.";
export const APP_URL = "https://www.jumpingpark.lat";

export const PUBLIC_ROUTES = [
	{
		pathname: "/consentimiento-digital",
		title: "Consentimiento digital para visitantes",
		description:
			"Explica el flujo publico de registro, validacion OTP y firma digital para visitantes y responsables en Jumping Park.",
		changeFrequency: "monthly" as const,
		priority: 0.7,
	},
] as const;

export const PUBLIC_PATHS = PUBLIC_ROUTES.map((route) => route.pathname);
export const PRIVATE_PATH_PREFIXES = [
	"/admin/",
	"/api/",
	"/ingreso/",
	"/otp/",
	"/registro/",
	"/consentimiento/",
	"/exito/",
	"/offline/",
] as const;

export const NON_INDEXABLE_ROBOTS: NonNullable<Metadata["robots"]> = {
	index: false,
	follow: false,
	googleBot: {
		index: false,
		follow: false,
		noimageindex: true,
		notranslate: true,
	},
};

export const INDEXABLE_ROBOTS: NonNullable<Metadata["robots"]> = {
	index: true,
	follow: true,
	googleBot: {
		index: true,
		follow: true,
		"max-image-preview": "large",
		"max-snippet": -1,
		"max-video-preview": -1,
	},
};

export function createCanonicalUrl(pathname = "/"): string {
	return new URL(pathname, APP_URL).toString();
}

export function buildPublicRobotsMetadata(): NonNullable<Metadata["robots"]> {
	const policy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.PUBLIC_SEO,
		source: "public-metadata",
		route: "/(public)",
	});

	return policy.enabled ? INDEXABLE_ROBOTS : NON_INDEXABLE_ROBOTS;
}

export function buildPublicRobotsManifest(): MetadataRoute.Robots {
	const policy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.PUBLIC_SEO,
		source: "robots",
		route: "/robots.txt",
	});

	if (!policy.enabled) {
		return {
			rules: {
				userAgent: "*",
				disallow: ["/"],
			},
			host: APP_URL,
		};
	}

	return {
		rules: {
			userAgent: "*",
			allow: [...PUBLIC_PATHS],
			disallow: [...PRIVATE_PATH_PREFIXES],
		},
		sitemap: `${APP_URL}/sitemap.xml`,
		host: APP_URL,
	};
}

export function buildPublicSitemap(): MetadataRoute.Sitemap {
	const policy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.PUBLIC_SEO,
		source: "sitemap",
		route: "/sitemap.xml",
	});

	if (!policy.enabled) {
		return [];
	}

	const now = new Date();

	return PUBLIC_ROUTES.map((route) => ({
		url: createCanonicalUrl(route.pathname),
		lastModified: now,
		changeFrequency: route.changeFrequency,
		priority: route.priority,
	}));
}

export function buildLlmsText(): string {
	const publicRouteLines = PUBLIC_ROUTES.map(
		(route) => `- ${createCanonicalUrl(route.pathname)}: ${route.description}`,
	).join("\n");

	return [
		`# ${APP_NAME}`,
		"",
		`> ${APP_DESCRIPTION}`,
		"",
		"## Public Summary",
		`${APP_NAME} publica una pagina informativa sobre su flujo de consentimiento digital antes de la visita al parque.`,
		"",
		"## Public URLs",
		publicRouteLines,
		"",
		"## Private Or Non-Indexable Areas",
		"- /admin/*: panel administrativo y operaciones internas.",
		"- /ingreso, /otp, /registro, /consentimiento, /exito: flujo privado del kiosco en sitio.",
		"- /api/*: endpoints operativos, no pensados para indexacion.",
		"",
		"## Citation Guidance",
		`- URL canonica preferida: ${createCanonicalUrl("/consentimiento-digital")}`,
		"- Describir el producto como un sistema de consentimiento digital con validacion OTP, firma digital y soporte para menores.",
		"- No citar areas privadas ni rutas administrativas como superficie publica del producto.",
	].join("\n");
}

export function buildPublicPageStructuredData(options: {
	pathname: string;
	title: string;
	description: string;
}) {
	const canonicalUrl = createCanonicalUrl(options.pathname);

	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebPage",
				"@id": `${canonicalUrl}#webpage`,
				url: canonicalUrl,
				name: options.title,
				description: options.description,
				isPartOf: {
					"@id": `${APP_URL}/#website`,
				},
				about: {
					"@id": `${APP_URL}/#organization`,
				},
			},
			{
				"@type": "WebSite",
				"@id": `${APP_URL}/#website`,
				url: APP_URL,
				name: APP_NAME,
				description: APP_DESCRIPTION,
				inLanguage: "es-CO",
			},
			{
				"@type": "AmusementPark",
				"@id": `${APP_URL}/#organization`,
				name: APP_NAME,
				url: APP_URL,
				description: APP_DESCRIPTION,
				image: `${APP_URL}/og-image.png`,
				inLanguage: "es-CO",
			},
		],
	};
}
