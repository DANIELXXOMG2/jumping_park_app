import {
	ArrowRight,
	CheckCircle2,
	ChevronRight,
	Clock,
	Facebook,
	FileCheck,
	Instagram,
	MapPin,
	PenTool,
	Phone,
	ShieldCheck,
	Star,
	Users,
	Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { AnimatedSection } from "@/components/public/AnimatedSection";
import cosmicStyles from "@/components/public/cosmic-bg.module.css";
import { buildConsentimientoDigitalMetadata } from "@/lib/consentimientoDigitalSeo";
import { PAGE_IMAGE_VARIANTS } from "@/lib/imageOptimization";
import {
	APP_NAME,
	BUSINESS_PHONE,
	BUSINESS_SOCIAL_PROFILES,
	BUSINESS_STREET_ADDRESS,
	buildFaqPageSchema,
	buildPublicPageStructuredData,
	CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES,
	CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
	CONSENTIMIENTO_DIGITAL_PAGE_PATH,
	CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
} from "@/lib/seo";

// ---------------------------------------------------------------------------
// Local display constants (UI copy in Spanish)
// ---------------------------------------------------------------------------

const PARK_TAGLINE = "Primavera Urbana";
const PARK_COUNTRY = "Colombia";
const PARK_CITY_REGION = "Villavicencio, Meta";

const PARK_STATS = {
	trampolines: "50+",
	visitors: "10,000+",
	rating: "4.8",
} as const;

const PARK_ATTRACTIONS = [
	"Mas de 50 camas elasticas interconectadas",
	"Piscina de espuma gigante",
	"Zona de salto libre",
	"Area infantil exclusiva",
	"Cancha de dodgeball",
	"Muro de escalada",
] as const;

const PARK_HOURS_DISPLAY = {
	weekdays: "Lunes a Viernes: 1:30 PM - 8:00 PM",
	weekends: "Sabados, Domingos y Festivos: 11:00 AM - 8:00 PM",
} as const;

// Social display names for UI
const INSTAGRAM_URL = BUSINESS_SOCIAL_PROFILES[0];
const FACEBOOK_URL = BUSINESS_SOCIAL_PROFILES[1];

const WHATSAPP_NUMBER_RAW = BUSINESS_PHONE.replace(/[\s+]/g, "");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER_RAW}`;

const PROCESS_STEPS = [
	{
		step: 1,
		title: "Completa tus datos",
		description:
			"Ingresa tu informacion personal y la de los menores que te acompanan. El formulario guiado te lleva paso a paso.",
		icon: FileCheck,
		duration: "2 min",
	},
	{
		step: 2,
		title: "Verifica tu identidad",
		description:
			"Recibe un codigo de 6 digitos en tu correo electronico. Esta validacion protege tu informacion y confirma tu identidad.",
		icon: ShieldCheck,
		duration: "1 min",
	},
	{
		step: 3,
		title: "Firma el consentimiento",
		description:
			"Revisa los terminos y firma digitalmente. Tu consentimiento queda registrado y listo para cuando llegues al parque.",
		icon: PenTool,
		duration: "1 min",
	},
] as const;

const BENEFITS = [
	{
		title: "Ahorra tiempo en la entrada",
		description:
			"Llega al parque con el consentimiento firmado y pasa directo a la diversion. Sin filas, sin esperas, sin papeles.",
		icon: Zap,
	},
	{
		title: "Registra a toda tu familia",
		description:
			"Un solo adulto puede registrar a todos los menores del grupo. Cada menor queda vinculado a su responsable legal.",
		icon: Users,
	},
	{
		title: "Seguridad garantizada",
		description:
			"Validacion por codigo OTP, firma digital con valor legal, y datos protegidos. Todo cumple con la normativa colombiana.",
		icon: ShieldCheck,
	},
] as const;

const REQUIREMENTS = [
	{
		item: "Documento de identidad",
		detail: "Cedula de ciudadania o tarjeta de identidad",
	},
	{
		item: "Correo electronico activo",
		detail: "Para recibir el codigo de verificacion OTP",
	},
	{
		item: "Datos de menores",
		detail: "Documento y fecha de nacimiento de cada menor",
	},
	{
		item: "5 minutos de tu tiempo",
		detail: "Es todo lo que necesitas para completar el proceso",
	},
] as const;

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------

const structuredData = buildPublicPageStructuredData({
	pathname: CONSENTIMIENTO_DIGITAL_PAGE_PATH,
	title: CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
	description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
});

const faqSchema = buildFaqPageSchema(CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES);

export const metadata: Metadata = buildConsentimientoDigitalMetadata();

// ---------------------------------------------------------------------------
// Page component (Server Component)
// ---------------------------------------------------------------------------

export default function ConsentimientoDigitalPage() {
	return (
		<>
			<Script
				id="structured-data"
				type="application/ld+json"
				strategy="afterInteractive"
			>
				{JSON.stringify(structuredData)}
			</Script>
			<Script
				id="faq-schema"
				type="application/ld+json"
				strategy="afterInteractive"
			>
				{JSON.stringify(faqSchema)}
			</Script>

			{/* Header / Nav */}
			<header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
					<Link href="/" className="flex items-center gap-3">
						<Image
							src={PAGE_IMAGE_VARIANTS.publicConsentLogo.src}
							alt={`Logo de ${APP_NAME}`}
							width={140}
							height={40}
							priority
							sizes={PAGE_IMAGE_VARIANTS.publicConsentLogo.sizes}
							className="h-8 w-auto sm:h-10"
						/>
					</Link>
					<nav className="flex items-center gap-2 sm:gap-4">
						<Link
							href="#como-funciona"
							className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-white sm:block"
						>
							Como funciona
						</Link>
						<Link
							href="#preguntas"
							className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-white sm:block"
						>
							Preguntas
						</Link>
						<Link
							href="/"
							className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-sm font-bold text-slate-950 transition-all hover:brightness-110"
						>
							Iniciar registro
							<ArrowRight className="h-4 w-4" aria-hidden="true" />
						</Link>
					</nav>
				</div>
			</header>

			<main className={`${cosmicStyles.background} min-h-screen pt-16`}>
				{/* ============================================================
				    HERO SECTION
				    ============================================================ */}
				<AnimatedSection sectionId="hero">
					<section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
						<div className="mx-auto max-w-6xl">
							<div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
								{/* Hero Content */}
								<div className="space-y-6">
									<div className="inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-1.5">
										<Star
											className="h-4 w-4 text-brand-yellow"
											aria-hidden="true"
										/>
										<span className="text-sm font-medium text-brand-green">
											{PARK_STATS.rating} estrellas en Google
										</span>
									</div>

									<h1 className="text-balance text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
										Firma tu consentimiento{" "}
										<span className="text-brand-green">antes de llegar</span>
									</h1>

									<p className="max-w-xl text-pretty text-lg leading-relaxed text-zinc-300">
										Completa el registro digital de{" "}
										<strong className="text-white">{APP_NAME}</strong> desde tu
										casa. Valida tu identidad con un codigo OTP, firma
										digitalmente y llega al parque listo para saltar.
									</p>

									<div className="flex flex-col gap-4 pt-2 sm:flex-row">
										<Link
											href="/"
											className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-8 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-brand-green/25 transition-all hover:brightness-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 focus:ring-offset-slate-950"
										>
											Empezar registro
											<ChevronRight className="h-5 w-5" aria-hidden="true" />
										</Link>
										<Link
											href="#como-funciona"
											className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10"
										>
											Ver como funciona
										</Link>
										<a
											href={WHATSAPP_URL}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-6 py-4 font-semibold text-brand-green transition-all hover:border-brand-green/50 hover:bg-brand-green/20"
										>
											Escribinos por WhatsApp
										</a>
									</div>

									{/* Quick Stats */}
									<div className="flex flex-wrap gap-6 pt-4">
										<div className="flex items-center gap-2">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/20">
												<Users
													className="h-5 w-5 text-brand-blue"
													aria-hidden="true"
												/>
											</div>
											<div>
												<p className="text-lg font-bold text-white">
													{PARK_STATS.visitors}
												</p>
												<p className="text-xs text-zinc-400">
													visitantes felices
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-yellow/20">
												<Zap
													className="h-5 w-5 text-brand-yellow"
													aria-hidden="true"
												/>
											</div>
											<div>
												<p className="text-lg font-bold text-white">
													{PARK_STATS.trampolines}
												</p>
												<p className="text-xs text-zinc-400">trampolines</p>
											</div>
										</div>
									</div>
								</div>

								{/* Hero Image */}
								<div className="relative hidden lg:block">
									<div className="absolute -inset-4 rounded-3xl bg-linear-to-br from-brand-green/20 via-brand-blue/10 to-transparent blur-2xl" />
									<div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-8">
										<Image
											src={PAGE_IMAGE_VARIANTS.kioskAstronaut.src}
											alt="Astronauta de Jumping Park invitandote a registrarte"
											width={400}
											height={400}
											priority
											sizes={PAGE_IMAGE_VARIANTS.kioskAstronaut.sizes}
											className="animate-float mx-auto h-auto w-full max-w-sm"
										/>
										<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
											<p className="text-center text-sm text-zinc-300">
												<strong className="text-white">
													Mas de {PARK_STATS.trampolines} camas elasticas
												</strong>{" "}
												te esperan en el parque de trampolines mas grande de
												Villavicencio.
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
				</AnimatedSection>

				{/* ============================================================
				    COMO FUNCIONA - PROCESO
				    ============================================================ */}
				<AnimatedSection sectionId="process">
					<section
						id="como-funciona"
						aria-labelledby="process-title"
						className="border-y border-white/10 bg-slate-950/60 px-4 py-16 sm:px-6 sm:py-24"
					>
						<div className="mx-auto max-w-6xl">
							<div className="mb-12 max-w-2xl">
								<h2
									id="process-title"
									className="text-balance text-3xl font-black tracking-tight text-white sm:text-4xl"
								>
									Tres pasos simples para tu consentimiento digital
								</h2>
								<p className="mt-4 text-lg text-zinc-400">
									El proceso completo toma menos de 5 minutos. Hazlo desde tu
									celular o computador.
								</p>
							</div>

							<div className="grid gap-6 md:grid-cols-3">
								{PROCESS_STEPS.map((step) => {
									const Icon = step.icon;
									return (
										<article
											key={step.step}
											className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-brand-green/30 hover:bg-brand-green/5"
										>
											<div className="mb-4 flex items-center justify-between">
												<div className="animate-bounce-jump flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/20 text-brand-green transition-colors group-hover:bg-brand-green/30">
													<Icon className="h-6 w-6" aria-hidden="true" />
												</div>
												<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-400">
													{step.duration}
												</span>
											</div>
											<div className="mb-2 flex items-center gap-2">
												<span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-slate-950">
													{step.step}
												</span>
												<h3 className="text-lg font-bold text-white">
													{step.title}
												</h3>
											</div>
											<p className="text-sm leading-relaxed text-zinc-400">
												{step.description}
											</p>
										</article>
									);
								})}
							</div>

							{/* Requirements Box */}
							<div className="mt-12 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/5 p-6 sm:p-8">
								<h3 className="mb-4 text-lg font-bold text-white">
									Que necesitas tener listo
								</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									{REQUIREMENTS.map((req) => (
										<div key={req.item} className="flex items-start gap-3">
											<CheckCircle2
												className="mt-0.5 h-5 w-5 shrink-0 text-brand-green"
												aria-hidden="true"
											/>
											<div>
												<p className="font-medium text-white">{req.item}</p>
												<p className="text-sm text-zinc-400">{req.detail}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</section>
				</AnimatedSection>

				{/* ============================================================
				    BENEFICIOS
				    ============================================================ */}
				<AnimatedSection sectionId="benefits">
					<section
						aria-labelledby="benefits-title"
						className="px-4 py-16 sm:px-6 sm:py-24"
					>
						<div className="mx-auto max-w-6xl">
							<div className="mb-12 text-center">
								<h2
									id="benefits-title"
									className="text-balance text-3xl font-black tracking-tight text-white sm:text-4xl"
								>
									Por que usar el consentimiento digital
								</h2>
								<p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
									Disenado para familias que quieren aprovechar al maximo su
									tiempo en el parque.
								</p>
							</div>

							<div className="grid gap-6 md:grid-cols-3">
								{BENEFITS.map((benefit) => {
									const Icon = benefit.icon;
									return (
										<article
											key={benefit.title}
											className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
										>
											<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/20 text-brand-blue">
												<Icon className="h-6 w-6" aria-hidden="true" />
											</div>
											<h3 className="mb-2 text-lg font-bold text-white">
												{benefit.title}
											</h3>
											<p className="text-sm leading-relaxed text-zinc-400">
												{benefit.description}
											</p>
										</article>
									);
								})}
							</div>
						</div>
					</section>
				</AnimatedSection>

				{/* ============================================================
				    FAQ
				    ============================================================ */}
				<AnimatedSection sectionId="faq">
					<section
						id="preguntas"
						aria-labelledby="faq-title"
						className="border-t border-white/10 bg-slate-950/60 px-4 py-16 sm:px-6 sm:py-24"
					>
						<div className="mx-auto max-w-4xl">
							<div className="mb-12 text-center">
								<h2
									id="faq-title"
									className="text-balance text-3xl font-black tracking-tight text-white sm:text-4xl"
								>
									Preguntas frecuentes
								</h2>
								<p className="mt-4 text-lg text-zinc-400">
									Resuelve tus dudas antes de completar el registro.
								</p>
							</div>

							<dl className="space-y-4">
								{CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES.map((entry, index) => (
									<div
										key={entry.question}
										className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20"
									>
										<dt className="flex items-start gap-4">
											<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-green/20 text-sm font-bold text-brand-green">
												{index + 1}
											</span>
											<span className="text-lg font-bold text-white">
												{entry.question}
											</span>
										</dt>
										<dd className="mt-3 pl-12 text-zinc-400">{entry.answer}</dd>
									</div>
								))}
							</dl>
						</div>
					</section>
				</AnimatedSection>

				{/* ============================================================
				    SOBRE EL PARQUE + CONTACTO
				    ============================================================ */}
				<AnimatedSection sectionId="about">
					<section
						aria-labelledby="about-title"
						className="border-t border-white/10 px-4 py-16 sm:px-6 sm:py-24"
					>
						<div className="mx-auto max-w-6xl">
							<div className="grid gap-12 lg:grid-cols-2">
								{/* Park Info */}
								<div>
									<h2
										id="about-title"
										className="text-balance text-3xl font-black tracking-tight text-white sm:text-4xl"
									>
										Conoce {APP_NAME}
									</h2>
									<p className="mt-4 text-lg text-zinc-400">
										El parque de trampolines mas grande de Villavicencio,
										ubicado en Centro Comercial Primavera Urbana. Diversion
										garantizada para toda la familia.
									</p>

									<div className="mt-8 space-y-3">
										<h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
											Nuestras atracciones
										</h3>
										<ul className="grid gap-2 sm:grid-cols-2">
											{PARK_ATTRACTIONS.map((attraction) => (
												<li
													key={attraction}
													className="flex items-center gap-2 text-zinc-300"
												>
													<CheckCircle2
														className="h-4 w-4 text-brand-green"
														aria-hidden="true"
													/>
													{attraction}
												</li>
											))}
										</ul>
									</div>
								</div>

								{/* Contact Card */}
								<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
									<h3 className="mb-6 text-xl font-bold text-white">
										Informacion de contacto
									</h3>

									<div className="space-y-4">
										<div className="flex items-start gap-4">
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/20">
												<MapPin
													className="h-5 w-5 text-brand-yellow"
													aria-hidden="true"
												/>
											</div>
											<div>
												<p className="font-medium text-white">
													Centro Comercial Primavera Urbana
												</p>
												<p className="text-sm text-zinc-400">
													{BUSINESS_STREET_ADDRESS}
												</p>
												<p className="text-sm text-zinc-400">
													{PARK_CITY_REGION}, {PARK_COUNTRY}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-4">
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green/20">
												<Phone
													className="h-5 w-5 text-brand-green"
													aria-hidden="true"
												/>
											</div>
											<div>
												<a
													href={`tel:${WHATSAPP_NUMBER_RAW}`}
													className="font-medium text-white hover:text-brand-green"
												>
													{BUSINESS_PHONE}
												</a>
												<p className="text-sm text-zinc-400">Llamanos</p>
											</div>
										</div>

										<div className="flex items-center gap-4">
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/20">
												<Clock
													className="h-5 w-5 text-brand-blue"
													aria-hidden="true"
												/>
											</div>
											<div>
												<p className="text-sm text-zinc-300">
													{PARK_HOURS_DISPLAY.weekdays}
												</p>
												<p className="text-sm text-zinc-300">
													{PARK_HOURS_DISPLAY.weekends}
												</p>
											</div>
										</div>

										<div className="flex gap-3 pt-2">
											<a
												href={INSTAGRAM_URL}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-400"
												aria-label="Seguir en Instagram"
											>
												<Instagram className="h-4 w-4" aria-hidden="true" />
												Instagram
											</a>
											<a
												href={FACEBOOK_URL}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
												aria-label="Seguir en Facebook"
											>
												<Facebook className="h-4 w-4" aria-hidden="true" />
												Facebook
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
				</AnimatedSection>

				{/* ============================================================
				    CTA FINAL
				    ============================================================ */}
				<AnimatedSection sectionId="cta-final">
					<section className="border-t border-white/10 px-4 py-16 sm:px-6 sm:py-24">
						<div className="mx-auto max-w-4xl text-center">
							<h2 className="text-balance text-3xl font-black tracking-tight text-white sm:text-4xl">
								No pierdas mas tiempo en filas
							</h2>
							<p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
								Completa tu consentimiento digital ahora y llega al parque listo
								para la diversion. Tu familia te lo agradecera.
							</p>
							<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
								<Link
									href="/"
									className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-10 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-brand-green/25 transition-all hover:brightness-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 focus:ring-offset-slate-950"
								>
									Completar registro ahora
									<ArrowRight className="h-5 w-5" aria-hidden="true" />
								</Link>
								<a
									href={WHATSAPP_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-10 py-4 text-lg font-bold text-brand-green transition-all hover:border-brand-green/50 hover:bg-brand-green/20"
								>
									Consultar por WhatsApp
								</a>
							</div>
							<p className="mt-6 text-sm text-zinc-500">
								El proceso toma menos de 5 minutos
							</p>
						</div>
					</section>
				</AnimatedSection>
			</main>

			{/* ============================================================
			    FOOTER
			    ============================================================ */}
			<footer className="border-t border-white/10 bg-slate-950">
				<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{/* Brand */}
						<div className="sm:col-span-2 lg:col-span-1">
							<Image
								src={PAGE_IMAGE_VARIANTS.publicConsentLogo.src}
								alt={`Logo de ${APP_NAME}`}
								width={140}
								height={40}
								loading="lazy"
								sizes={PAGE_IMAGE_VARIANTS.publicConsentLogo.sizes}
								className="h-10 w-auto"
							/>
							<p className="mt-4 text-sm text-zinc-500">{PARK_TAGLINE}</p>
							<p className="mt-2 text-sm text-zinc-500">
								El parque de trampolines mas grande de Villavicencio.
							</p>
						</div>

						{/* Links */}
						<div>
							<h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
								Enlaces rapidos
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="/"
										className="text-sm text-zinc-500 hover:text-white"
									>
										Iniciar registro
									</Link>
								</li>
								<li>
									<Link
										href="#como-funciona"
										className="text-sm text-zinc-500 hover:text-white"
									>
										Como funciona
									</Link>
								</li>
								<li>
									<Link
										href="#preguntas"
										className="text-sm text-zinc-500 hover:text-white"
									>
										Preguntas frecuentes
									</Link>
								</li>
							</ul>
						</div>

						{/* Contact */}
						<div>
							<h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
								Contacto
							</h4>
							<ul className="space-y-2">
								<li className="flex items-center gap-2 text-sm text-zinc-500">
									<Phone className="h-4 w-4" aria-hidden="true" />
									<a
										href={`tel:${WHATSAPP_NUMBER_RAW}`}
										className="hover:text-white"
									>
										{BUSINESS_PHONE}
									</a>
								</li>
							</ul>
						</div>

						{/* Social */}
						<div>
							<h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
								Siguenos
							</h4>
							<div className="flex gap-3">
								<a
									href={INSTAGRAM_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-400"
									aria-label="Instagram"
								>
									<Instagram className="h-5 w-5" aria-hidden="true" />
								</a>
								<a
									href={FACEBOOK_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
									aria-label="Facebook"
								>
									<Facebook className="h-5 w-5" aria-hidden="true" />
								</a>
							</div>
						</div>
					</div>

					{/* Bottom */}
					<div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
						<p className="text-sm text-zinc-500">{BUSINESS_STREET_ADDRESS}</p>
						<p className="text-sm text-zinc-600">
							&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos
							reservados.
						</p>
					</div>
				</div>
			</footer>
		</>
	);
}
