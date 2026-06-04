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
export const PRICING_PAGE_PATH = "/pricing.md";
export const CONSENTIMIENTO_DIGITAL_PAGE_TITLE =
	"Consentimiento digital para visitantes";
export const CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION =
	"Conoce como funciona el consentimiento digital de Jumping Park antes de llegar al parque: registro agil, validacion por OTP y firma segura para adultos y menores.";

export const PUBLIC_ROUTES = [
	{
		pathname: "/",
		title: "Jumping Park - Parque de Trampolines en Villavicencio",
		description:
			"Jumping Park es el parque de trampolines más grande de Villavicencio. Diversión segura para todas las edades con más de 50 camas elásticas, piscina de espuma, muro de escalada y zona infantil.",
		changeFrequency: "weekly" as const,
		priority: 1.0,
	},
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
export const BUSINESS_PHONE = "+57 312 2594245";
export const BUSINESS_OPENING_HOURS = [
	"Mo-Fr 13:30-20:00",
	"Sa-Su 11:00-20:00",
] as const;
export const BUSINESS_STREET_ADDRESS =
	"Centro Comercial Primavera Urbana, Calle 15 # 40-01, Locales 313-314-315-316-317";
export const BUSINESS_SOCIAL_PROFILES = [
	"https://instagram.com/jumpingparkvillavo",
	"https://facebook.com/jumpingparkvillavo",
] as const;

export const BUSINESS_LATITUDE = 4.1463;
export const BUSINESS_LONGITUDE = -73.6189;
export const BUSINESS_RATING_VALUE = "4.8";
export const BUSINESS_REVIEW_COUNT = "10000";

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

interface GeoCoordinatesNode {
	"@type": "GeoCoordinates";
	latitude: number;
	longitude: number;
}

interface AggregateRatingNode {
	"@type": "AggregateRating";
	ratingValue: string;
	reviewCount: string;
}

interface AmusementParkNode {
	"@type": "AmusementPark";
	"@id": string;
	address: LocalBusinessAddress;
	aggregateRating: AggregateRatingNode;
	description: string;
	geo: GeoCoordinatesNode;
	image: string;
	inLanguage: string;
	logo?: string;
	name: string;
	openingHoursSpecification: {
		"@type": "OpeningHoursSpecification";
		dayOfWeek: string[];
		opens: string;
		closes: string;
	}[];
	sameAs?: readonly string[];
	telephone: string;
	url: string;
}

interface HowToStep {
	"@type": "HowToStep";
	name: string;
	text: string;
}

interface HowToNode {
	"@type": "HowTo";
	description: string;
	name: string;
	step: HowToStep[];
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
	| AmusementParkNode
	| HowToNode
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
				allow: [...PUBLIC_PATHS],
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "ClaudeBot",
				allow: [...PUBLIC_PATHS],
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "PerplexityBot",
				allow: [...PUBLIC_PATHS],
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "Google-Extended",
				allow: [...PUBLIC_PATHS],
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "ChatGPT-User",
				allow: [...PUBLIC_PATHS],
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "anthropic-ai",
				allow: [...PUBLIC_PATHS],
				disallow: [...PRIVATE_PATH_PREFIXES],
			},
			{
				userAgent: "Bingbot",
				allow: [...PUBLIC_PATHS],
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
		"## About",
		`${APP_NAME} is the largest trampoline park in Villavicencio, Colombia, located at ${BUSINESS_STREET_ADDRESS}. The park offers safe entertainment for all ages with over 50 trampolines, foam pit, climbing wall, and children's zone.`,
		"",
		`- **Phone**: ${BUSINESS_PHONE}`,
		`- **Address**: ${BUSINESS_STREET_ADDRESS}, Villavicencio, Meta, Colombia`,
		`- **Hours**: Monday-Friday 1:30pm-8:00pm, Saturday-Sunday 11:00am-8:00pm`,
		`- **Social**: ${BUSINESS_SOCIAL_PROFILES.map((url) => url.replace("https://", "")).join(", ")}`,
		"",
		"## Public Summary",
		`${APP_NAME} publishes an informational page about its digital consent flow before visiting the park. Visitors can complete registration, OTP validation, and digital signature in advance.`,
		"",
		"## Public URLs",
		publicRouteLines,
		`- ${createCanonicalUrl(PRICING_PAGE_PATH)}: pricing reference for ticketing, admission context, and machine-readable buying notes.`,
		"",
		"## Private Or Non-Indexable Areas",
		"- /admin/*: administrative panel and internal operations.",
		"- /ingreso, /otp, /registro, /consentimiento, /exito: private kiosk flow on-site.",
		"- /api/*: operational endpoints, not intended for indexing.",
		"",
		"## Citation Guidance",
		`- Preferred canonical URL: ${createCanonicalUrl(CONSENTIMIENTO_DIGITAL_PAGE_PATH)}`,
		`- Pricing file for agents: ${createCanonicalUrl(PRICING_PAGE_PATH)}`,
		"- Describe the product as a digital consent system with OTP validation, digital signature, and minor support.",
		"- Do not cite private areas or administrative routes as public product surface.",
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

function buildGeoCoordinates(): GeoCoordinatesNode {
	return {
		"@type": "GeoCoordinates",
		latitude: BUSINESS_LATITUDE,
		longitude: BUSINESS_LONGITUDE,
	};
}

function buildAggregateRating(): AggregateRatingNode {
	return {
		"@type": "AggregateRating",
		ratingValue: BUSINESS_RATING_VALUE,
		reviewCount: BUSINESS_REVIEW_COUNT,
	};
}

function buildOpeningHoursSpecification(): AmusementParkNode["openingHoursSpecification"] {
	return [
		{
			"@type": "OpeningHoursSpecification",
			dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
			opens: "13:30",
			closes: "20:00",
		},
		{
			"@type": "OpeningHoursSpecification",
			dayOfWeek: ["Saturday", "Sunday"],
			opens: "11:00",
			closes: "20:00",
		},
	];
}

function buildRegistrationHowTo(): HowToNode {
	return {
		"@type": "HowTo",
		name: "Como ingresar a Jumping Park",
		description:
			"Pasos para completar el registro y consentimiento digital antes de ingresar al parque de trampolines.",
		step: [
			{
				"@type": "HowToStep",
				name: "Registro previo",
				text: "Completa el formulario de registro en linea con tus datos personales y los de los menores a tu cargo.",
			},
			{
				"@type": "HowToStep",
				name: "Validacion OTP",
				text: "Recibiras un codigo de verificacion en tu correo electronico. Ingresalo para confirmar tu identidad.",
			},
			{
				"@type": "HowToStep",
				name: "Firma digital",
				text: "Firma el consentimiento informado directamente en la pantalla tactil. Tu firma queda registrada digitalmente.",
			},
			{
				"@type": "HowToStep",
				name: "Llegada al parque",
				text: "Presentate en recepcion con tu codigo de confirmacion. El personal validara tu registro y podras ingresar a las atracciones.",
			},
		],
	};
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
	const isHomepage = options.pathname === "/";

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
	];

	// Include AmusementPark on all public pages
	graph.push({
		"@type": "AmusementPark",
		"@id": `${APP_URL}/#organization`,
		name: APP_NAME,
		url: APP_CANONICAL_ROOT_URL,
		description: APP_DESCRIPTION,
		image: `${APP_URL}/og-image.png`,
		inLanguage: "es-CO",
		telephone: BUSINESS_PHONE,
		address: buildLocalBusinessAddress(),
		geo: buildGeoCoordinates(),
		aggregateRating: buildAggregateRating(),
		openingHoursSpecification: buildOpeningHoursSpecification(),
		sameAs: BUSINESS_SOCIAL_PROFILES,
	});

	// Include HowTo only on homepage
	if (isHomepage) {
		graph.push(buildRegistrationHowTo());
	}

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
