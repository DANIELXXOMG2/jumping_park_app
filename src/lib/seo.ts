import type { Metadata, MetadataRoute } from "next";
import {
	evaluateHardeningFlag,
	type HardeningFlagResolution,
	HARDENING_FLAG,
	resolveHardeningFlag,
} from "@/lib/hardeningPolicy";

export const APP_NAME = "Jumping Park";
export const APP_DESCRIPTION =
	"Sistema de registro y consentimiento informado para visitantes de Jumping Park. Firma digital segura y gestion de menores.";
export const APP_URL = "https://www.jumpingpark.lat";
export const APP_CANONICAL_ROOT_URL = new URL("/", APP_URL).toString();
export const CONSENTIMIENTO_DIGITAL_PAGE_PATH = "/consentimiento-digital";
export const CONSENTIMIENTO_DIGITAL_PAGE_TITLE =
	"Consentimiento digital para visitantes";
export const CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION =
	"Conoce como funciona el consentimiento digital de Jumping Park antes de llegar al parque: registro agil, validacion por OTP y firma segura para adultos y menores.";

export const PUBLIC_ROUTES = [
	{
		pathname: CONSENTIMIENTO_DIGITAL_PAGE_PATH,
		title: CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
		description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
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

export const FRESHNESS_DATE = "2026-05-17T00:00:00.000Z";
export const BUSINESS_PHONE = "(608) 677 9985";
export const BUSINESS_OPENING_HOURS = [
	"Mo-Fr 14:00-20:00",
	"Sa-Su 11:00-20:00",
] as const;
export const BUSINESS_STREET_ADDRESS =
	"Centro Comercial Primavera Urbana, Calle 15 # 40-01, Locales 313-314-315-316-317";

export interface FaqItem {
	answer: string;
	question: string;
}

interface LocalBusinessAddress {
	"@type": "PostalAddress";
	addressCountry: string;
	addressLocality: string;
	addressRegion: string;
	streetAddress: string;
}

interface WebPageNode {
	"@type": "WebPage";
	"@id": string;
	about: {
		"@id": string;
	};
	description: string;
	isPartOf: {
		"@id": string;
	};
	name: string;
	url: string;
}

interface WebSiteNode {
	"@type": "WebSite";
	"@id": string;
	description: string;
	inLanguage: string;
	name: string;
	url: string;
}

interface LocalBusinessNode {
	"@type": "LocalBusiness";
	"@id": string;
	address: LocalBusinessAddress;
	description: string;
	image: string;
	inLanguage: string;
	name: string;
	openingHours: string[];
	telephone: string;
	url: string;
}

interface BreadcrumbListItem {
	"@type": "ListItem";
	item: string;
	name: string;
	position: number;
}

interface BreadcrumbListNode {
	"@type": "BreadcrumbList";
	itemListElement: BreadcrumbListItem[];
}

type StructuredDataGraphNode =
	| WebPageNode
	| WebSiteNode
	| LocalBusinessNode
	| BreadcrumbListNode;

export const CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES = [
	{
		answer:
			"Documento del visitante, correo del responsable y unos minutos para validar el OTP y firmar.",
		question: "Que necesito tener listo antes de llegar?",
	},
	{
		answer:
			"El flujo solicita al adulto responsable, relaciona al menor y deja el consentimiento claro para el equipo.",
		question: "Que pasa si quien va a ingresar es menor de edad?",
	},
	{
		answer:
			"Si. El consentimiento queda capturado digitalmente y disponible para soporte operativo y consulta administrativa.",
		question: "La firma digital reemplaza el formato fisico?",
	},
	{
		answer:
			"Reduce filas, evita repetir datos en recepcion y permite llegar al parque con el proceso mucho mas claro.",
		question: "En que mejora esto mi ingreso al parque?",
	},
] as const satisfies readonly FaqItem[];

export function createCanonicalUrl(pathname = "/"): string {
	return new URL(pathname, APP_URL).toString();
}

export function buildPublicSeoPolicy(): HardeningFlagResolution {
	return resolveHardeningFlag(HARDENING_FLAG.PUBLIC_SEO);
}

export function buildRobotsMetadataFromPolicy(
	policy: Pick<HardeningFlagResolution, "enabled">,
): NonNullable<Metadata["robots"]> {
	return policy.enabled ? INDEXABLE_ROBOTS : NON_INDEXABLE_ROBOTS;
}

export function buildPublicRobotsMetadata(): NonNullable<Metadata["robots"]> {
	const policy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.PUBLIC_SEO,
		source: "public-metadata",
		route: "/(public)",
	});

	return buildRobotsMetadataFromPolicy(policy);
}

export function buildSiteVerification(
	policy: Pick<HardeningFlagResolution, "enabled"> = buildPublicSeoPolicy(),
): NonNullable<Metadata["verification"]> {
	if (!policy.enabled) {
		return {};
	}

	const googleCode = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

	if (!googleCode) {
		return {};
	}

	return {
		google: googleCode,
	};
}

export function buildPageFreshnessMetadata(lastModified?: string): {
	modifiedTime: string;
} {
	return {
		modifiedTime: lastModified ?? FRESHNESS_DATE,
	};
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
		rules: [
			{
				userAgent: "*",
				allow: [...PUBLIC_PATHS],
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "GPTBot",
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "ClaudeBot",
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "PerplexityBot",
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "Google-Extended",
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
		],
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

export function buildFaqPageSchema(faqs: readonly FaqItem[]) {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};
}

export function buildLlmsText(): string {
	const publicRouteLines = PUBLIC_ROUTES.map(
		(route) => `- ${createCanonicalUrl(route.pathname)}: ${route.description}`,
	).join("\n");
	const faqLines = CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES.map(
		(entry) => `- ${entry.question}: ${entry.answer}`,
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
		`- URL canonica preferida: ${createCanonicalUrl(CONSENTIMIENTO_DIGITAL_PAGE_PATH)}`,
		"- Describir el producto como un sistema de consentimiento digital con validacion OTP, firma digital y soporte para menores.",
		"- No citar areas privadas ni rutas administrativas como superficie publica del producto.",
		"",
		"## FAQ",
		faqLines,
	].join("\n");
}

function buildLocalBusinessAddress(): LocalBusinessAddress {
	return {
		"@type": "PostalAddress",
		streetAddress: BUSINESS_STREET_ADDRESS,
		addressLocality: "Villavicencio",
		addressRegion: "Meta",
		addressCountry: "CO",
	};
}

function buildBreadcrumbListItems(options: {
	pathname: string;
	title: string;
}): BreadcrumbListItem[] | undefined {
	if (options.pathname === "/") {
		return undefined;
	}

	return [
		{
			"@type": "ListItem",
			position: 1,
			name: APP_NAME,
			item: createCanonicalUrl("/"),
		},
		{
			"@type": "ListItem",
			position: 2,
			name: options.title,
			item: createCanonicalUrl(options.pathname),
		},
	];
}

export function buildPublicPageStructuredData(options: {
	pathname: string;
	title: string;
	description: string;
}) {
	const canonicalUrl = createCanonicalUrl(options.pathname);
	const breadcrumbListItems = buildBreadcrumbListItems({
		pathname: options.pathname,
		title: options.title,
	});
	const graph: StructuredDataGraphNode[] = [
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
			url: APP_CANONICAL_ROOT_URL,
			name: APP_NAME,
			description: APP_DESCRIPTION,
			inLanguage: "es-CO",
		},
		{
			"@type": "LocalBusiness",
			"@id": `${APP_URL}/#organization`,
			name: APP_NAME,
			url: APP_CANONICAL_ROOT_URL,
			description: APP_DESCRIPTION,
			image: `${APP_URL}/og-image.png`,
			inLanguage: "es-CO",
			telephone: BUSINESS_PHONE,
			address: buildLocalBusinessAddress(),
			openingHours: [...BUSINESS_OPENING_HOURS],
		},
	];

	if (breadcrumbListItems) {
		graph.push({
			"@type": "BreadcrumbList",
			itemListElement: breadcrumbListItems,
		});
	}

	return {
		"@context": "https://schema.org",
		"@graph": graph,
	};
}
