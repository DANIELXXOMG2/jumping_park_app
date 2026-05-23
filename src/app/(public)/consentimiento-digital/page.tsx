import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { AnimatedSection } from "@/components/public/AnimatedSection";
import {
	APP_NAME,
	CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES,
	buildFaqPageSchema,
	buildPageFreshnessMetadata,
	buildPublicPageStructuredData,
	createCanonicalUrl,
} from "@/lib/seo";
import "@/components/public/cosmic-bg.css";

const PAGE_PATH = "/consentimiento-digital";
const OPEN_GRAPH_IMAGE_URL = createCanonicalUrl("/opengraph-image");
const PAGE_TITLE = "Consentimiento digital para visitantes";
const PAGE_DESCRIPTION =
	"Conoce como funciona el consentimiento digital de Jumping Park antes de llegar al parque: registro agil, validacion por OTP y firma segura para adultos y menores.";

const FLOW_STEPS = [
	{
		description:
			"El visitante completa sus datos una sola vez y deja listo el punto de partida para recepcion.",
		title: "1. Registro guiado",
	},
	{
		description:
			"El OTP confirma al responsable y reduce errores antes de llegar a taquilla o ingreso.",
		title: "2. Validacion segura",
	},
	{
		description:
			"La firma queda asociada al consentimiento para soporte operativo, consulta y seguimiento del equipo.",
		title: "3. Firma lista",
	},
] as const;

const HERO_HIGHLIGHTS = [
	"OTP por correo del responsable.",
	"Firma digital para adultos y menores.",
	"Registro consultable por el equipo del parque.",
] as const;

const TRUST_METRICS = [
	{
		label: "3 pasos claros",
		value: "Registro, OTP y firma en el mismo recorrido.",
	},
	{
		label: "1 flujo oficial",
		value:
			"Esta pagina explica exactamente lo que vas a completar en el kiosco.",
	},
	{
		label: "0 papeles sueltos",
		value: "Todo queda centralizado para recepcion, soporte y seguimiento.",
	},
] as const;

const TRUST_PILLARS = [
	{
		description:
			"El visitante llega con menos preguntas repetidas y el equipo recibe la informacion en el orden correcto.",
		title: "Operacion mas fluida",
	},
	{
		description:
			"Cuando participa un menor, el recorrido deja asociado al adulto responsable y evita vacios al momento del ingreso.",
		title: "Cobertura para grupos familiares",
	},
	{
		description:
			"La firma digital y los datos del consentimiento quedan listos para consulta administrativa cuando se necesiten.",
		title: "Respaldo para el parque",
	},
] as const;

const structuredData = buildPublicPageStructuredData({
	pathname: PAGE_PATH,
	title: PAGE_TITLE,
	description: PAGE_DESCRIPTION,
});

const faqPageStructuredData = buildFaqPageSchema(
	CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES,
);

export const metadata: Metadata = {
	title: PAGE_TITLE,
	description: PAGE_DESCRIPTION,
	alternates: {
		canonical: PAGE_PATH,
	},
	openGraph: {
		title: `${PAGE_TITLE} | ${APP_NAME}`,
		description: PAGE_DESCRIPTION,
		url: createCanonicalUrl(PAGE_PATH),
		type: "article",
		...buildPageFreshnessMetadata(),
		images: [
			{
				url: OPEN_GRAPH_IMAGE_URL,
				width: 1200,
				height: 630,
				alt: `${APP_NAME} | Consentimiento digital premium`,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `${PAGE_TITLE} | ${APP_NAME}`,
		description: PAGE_DESCRIPTION,
		images: [OPEN_GRAPH_IMAGE_URL],
	},
};

export default function ConsentimientoDigitalPage() {
	return (
		<main className="cosmic-bg min-h-screen px-6 py-16 text-zinc-50 sm:px-10 lg:px-16">
			<Script
				id="consentimiento-digital-jsonld"
				type="application/ld+json"
				strategy="afterInteractive"
			>
				{JSON.stringify(structuredData)}
			</Script>
			<Script
				id="faqpage-jsonld"
				type="application/ld+json"
				strategy="afterInteractive"
			>
				{JSON.stringify(faqPageStructuredData)}
			</Script>

			<article className="mx-auto flex max-w-6xl flex-col gap-10">
				<AnimatedSection sectionId="hero">
					<header className="grid gap-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
						<div className="space-y-6">
							<p className="text-sm uppercase tracking-widest text-cyan-200">
								Consentimiento digital oficial
							</p>
							<h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
								Firma antes de llegar. Entra al parque con menos filas y mas
								confianza.
							</h1>
							<p className="max-w-2xl text-lg leading-8 text-zinc-100/90">
								Jumping Park centraliza identidad, responsables y firma digital
								en un recorrido claro para visitantes, familias y grupos. El
								objetivo es simple: llegar al parque con el consentimiento listo
								y la operacion mucho mejor preparada.
							</p>
							<div className="flex flex-wrap gap-3 text-sm text-zinc-100/90">
								{HERO_HIGHLIGHTS.map((highlight) => (
									<span
										key={highlight}
										className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2"
									>
										{highlight}
									</span>
								))}
							</div>
							<div className="flex flex-wrap gap-4">
								<Link
									href="/"
									className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 shadow-xl transition hover:bg-cyan-200"
								>
									Empezar registro en el kiosco
								</Link>
								<Link
									href="#flujo-digital"
									className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-cyan-200/60 hover:text-cyan-100"
								>
									Ver como funciona
								</Link>
							</div>
						</div>

						<div className="grid gap-4 rounded-[1.6rem] border border-cyan-200/20 bg-slate-950/55 p-6 shadow-xl">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm uppercase tracking-widest text-cyan-200">
										Respaldado por el parque
									</p>
									<p className="mt-2 text-2xl font-bold text-white">
										Todo lo que el equipo necesita, en un solo recorrido
										digital.
									</p>
								</div>
								<div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-3">
									<Image
										src="/assets/jumping-park-logo-optimized.png"
										alt="Jumping Park"
										width={160}
										height={46}
										priority
										className="h-auto w-32 object-contain sm:w-36"
									/>
								</div>
							</div>
							<div className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-zinc-200">
								<p className="font-semibold text-white">
									Llega sabiendo que vas a encontrar
								</p>
								<ul className="space-y-2">
									<li>Una ruta unica para visitantes nuevos y recurrentes.</li>
									<li>
										Menos friccion entre recepcion, taquilla y consentimiento.
									</li>
									<li>
										Un respaldo claro para adultos responsables y menores.
									</li>
								</ul>
							</div>
						</div>
					</header>
				</AnimatedSection>

				<AnimatedSection sectionId="flow">
					<section
						id="flujo-digital"
						aria-labelledby="flujo-title"
						className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
					>
						<div className="space-y-5 rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-xl">
							<p className="text-sm uppercase tracking-widest text-cyan-200">
								Flujo de conversion y confianza
							</p>
							<h2
								id="flujo-title"
								className="text-3xl font-black tracking-tight text-white sm:text-4xl"
							>
								Tres pasos. Un solo flujo oficial. Cero dudas al llegar.
							</h2>
							<p className="text-base leading-8 text-zinc-200">
								La pagina publica ya te deja claro que informacion vas a
								completar, quien valida el acceso y por que la firma digital
								acelera el ingreso.
							</p>
							<div className="rounded-[1.4rem] border border-cyan-200/20 bg-cyan-300/10 p-5">
								<p className="text-sm font-semibold uppercase tracking-widest text-cyan-100">
									Llega con esto listo
								</p>
								<ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-100/90">
									<li>Documento del visitante.</li>
									<li>Correo del adulto responsable para validar OTP.</li>
									<li>
										Decision lista para firmar sin repetir el proceso en
										taquilla.
									</li>
								</ul>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-3">
							{FLOW_STEPS.map((step, index) => (
								<AnimatedSection
									key={step.title}
									sectionId={`flow-card-${index + 1}`}
									className="h-full"
								>
									<article
										aria-labelledby={`flow-card-title-${index + 1}`}
										className="h-full rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"
									>
										<h3
											id={`flow-card-title-${index + 1}`}
											className="text-xl font-bold text-white"
										>
											{step.title}
										</h3>
										<p className="mt-3 text-sm leading-7 text-zinc-200">
											{step.description}
										</p>
									</article>
								</AnimatedSection>
							))}
						</div>
					</section>
				</AnimatedSection>

				<AnimatedSection sectionId="trust-bar">
					<section
						aria-labelledby="trust-bar-title"
						className="rounded-[1.8rem] border border-white/10 bg-slate-950/45 p-6 backdrop-blur-2xl sm:p-8"
					>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="text-sm uppercase tracking-widest text-cyan-200">
									Trust shelf
								</p>
								<h2
									id="trust-bar-title"
									className="mt-2 text-3xl font-black tracking-tight text-white"
								>
									Lo que cambia para tu visita y para la operacion.
								</h2>
							</div>
							<p className="max-w-2xl text-sm leading-7 text-zinc-200">
								El consentimiento digital no es solo una forma moderna de
								firmar. Es una forma de llegar con expectativas claras,
								responsables definidos y soporte mas ordenado cuando el parque
								lo necesita.
							</p>
						</div>
						<div className="mt-6 grid gap-4 md:grid-cols-3">
							{TRUST_METRICS.map((metric) => (
								<div
									key={metric.label}
									className="rounded-[1.35rem] border border-cyan-200/10 bg-cyan-300/10 p-5"
								>
									<p className="text-sm uppercase tracking-widest text-cyan-100">
										{metric.label}
									</p>
									<p className="mt-3 text-sm leading-7 text-zinc-100/90">
										{metric.value}
									</p>
								</div>
							))}
						</div>
						<div className="mt-6 grid gap-4 lg:grid-cols-3">
							{TRUST_PILLARS.map((pillar) => (
								<div
									key={pillar.title}
									className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5"
								>
									<h3 className="text-lg font-bold text-white">
										{pillar.title}
									</h3>
									<p className="mt-3 text-sm leading-7 text-zinc-200">
										{pillar.description}
									</p>
								</div>
							))}
						</div>
					</section>
				</AnimatedSection>

				<AnimatedSection sectionId="faq">
					<section
						id="preguntas-frecuentes"
						aria-labelledby="faq-title"
						className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8"
					>
						<div className="max-w-3xl">
							<p className="text-sm uppercase tracking-widest text-cyan-200">
								FAQ de preparacion
							</p>
							<h2
								id="faq-title"
								className="mt-2 text-3xl font-black tracking-tight text-white"
							>
								Preguntas frecuentes antes de tu visita
							</h2>
							<p className="mt-4 text-base leading-8 text-zinc-200">
								Las respuestas clave estan visibles desde el primer scroll para
								que el visitante sepa que esperar y el parque no dependa de
								explicaciones de ultimo minuto.
							</p>
						</div>
						<dl className="mt-6 grid gap-4 md:grid-cols-2">
							{CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES.map((entry) => (
								<div
									key={entry.question}
									className="rounded-[1.35rem] border border-white/10 bg-slate-950/45 p-5"
								>
									<dt className="text-lg font-bold text-white">
										{entry.question}
									</dt>
									<dd className="mt-3 text-sm leading-7 text-zinc-200">
										{entry.answer}
									</dd>
								</div>
							))}
						</dl>
					</section>
				</AnimatedSection>

				<AnimatedSection sectionId="cta">
					<section
						aria-labelledby="cta-title"
						className="rounded-[1.9rem] border border-cyan-200/10 bg-linear-to-r from-cyan-400/20 via-emerald-300/10 to-slate-950/70 p-8 shadow-2xl backdrop-blur-2xl"
					>
						<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
							<div className="max-w-3xl">
								<p className="text-sm uppercase tracking-widest text-cyan-100">
									CTA principal
								</p>
								<h2
									id="cta-title"
									className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl"
								>
									Si queres llegar con el consentimiento resuelto, este es el
									momento.
								</h2>
								<p className="mt-4 text-base leading-8 text-zinc-100/90">
									Abri el kiosco, completa el flujo oficial y deja listo el
									ingreso antes de pisar la recepcion del parque.
								</p>
							</div>
							<div className="flex flex-wrap gap-4">
								<Link
									href="/"
									className="rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100"
								>
									Empezar registro en el kiosco
								</Link>
								<Link
									href="#preguntas-frecuentes"
									className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-cyan-100 hover:text-cyan-100"
								>
									Resolver dudas primero
								</Link>
							</div>
						</div>
					</section>
				</AnimatedSection>
			</article>
		</main>
	);
}
