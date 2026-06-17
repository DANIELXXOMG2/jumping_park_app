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
import { LanguageToggle } from "@/components/kiosk/LanguageToggle";
import { AnimatedSection } from "@/components/public/AnimatedSection";
import cosmicStyles from "@/components/public/cosmic-bg.module.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { buildConsentimientoDigitalMetadata } from "@/lib/consentimientoDigitalSeo";
import { type DictionaryKey } from "@/lib/i18n/dictionary";
import { createServerTranslator } from "@/lib/i18n/serverTranslate";
import { PAGE_IMAGE_VARIANTS } from "@/lib/imageOptimization";
import { cn } from "@/lib/utils";
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
// Social display names for UI
// ---------------------------------------------------------------------------

const INSTAGRAM_URL = BUSINESS_SOCIAL_PROFILES[0];
const FACEBOOK_URL = BUSINESS_SOCIAL_PROFILES[1];

const WHATSAPP_NUMBER_RAW = BUSINESS_PHONE.replace(/[\s+]/g, "");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER_RAW}`;

// ---------------------------------------------------------------------------
// Structured data (not translatable — kept as-is)
// ---------------------------------------------------------------------------

const structuredData = buildPublicPageStructuredData({
	pathname: CONSENTIMIENTO_DIGITAL_PAGE_PATH,
	title: CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
	description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
});

const faqSchema = buildFaqPageSchema(CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES);

export const metadata: Metadata = buildConsentimientoDigitalMetadata();

// ---------------------------------------------------------------------------
// Page component (async Server Component)
// ---------------------------------------------------------------------------

export default async function ConsentimientoDigitalPage() {
	const { t, locale } = await createServerTranslator();

	// Shorthand helper — t() accepts DictionaryKey, our dynamic keys are valid
	const tk = (key: DictionaryKey) => t(key);

	// Stats — raw numbers, labels from dictionary
	const PARK_STATS = {
		trampolines: "50+",
		visitors: "10,000+",
		rating: "4.8",
	} as const;

	// Process steps — icons are component references, text from dictionary
	const PROCESS_STEPS = [
		{
			step: 1,
			title: tk("consentDigital.process.step1.title"),
			description: tk("consentDigital.process.step1.description"),
			icon: FileCheck,
			duration: tk("consentDigital.process.step1.duration"),
		},
		{
			step: 2,
			title: tk("consentDigital.process.step2.title"),
			description: tk("consentDigital.process.step2.description"),
			icon: ShieldCheck,
			duration: tk("consentDigital.process.step2.duration"),
		},
		{
			step: 3,
			title: tk("consentDigital.process.step3.title"),
			description: tk("consentDigital.process.step3.description"),
			icon: PenTool,
			duration: tk("consentDigital.process.step3.duration"),
		},
	] as const;

	// Benefits
	const BENEFITS = [
		{
			title: tk("consentDigital.benefits.item1.title"),
			description: tk("consentDigital.benefits.item1.description"),
			icon: Zap,
		},
		{
			title: tk("consentDigital.benefits.item2.title"),
			description: tk("consentDigital.benefits.item2.description"),
			icon: Users,
		},
		{
			title: tk("consentDigital.benefits.item3.title"),
			description: tk("consentDigital.benefits.item3.description"),
			icon: ShieldCheck,
		},
	] as const;

	// Requirements
	const REQUIREMENTS = [
		{
			item: tk("consentDigital.requirements.item1"),
			detail: tk("consentDigital.requirements.detail1"),
		},
		{
			item: tk("consentDigital.requirements.item2"),
			detail: tk("consentDigital.requirements.detail2"),
		},
		{
			item: tk("consentDigital.requirements.item3"),
			detail: tk("consentDigital.requirements.detail3"),
		},
		{
			item: tk("consentDigital.requirements.item4"),
			detail: tk("consentDigital.requirements.detail4"),
		},
	] as const;

	return (
		<LanguageProvider initialLanguage={locale}>
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
							alt={t("consentDigital.header.logoAlt", {
								appName: APP_NAME,
							})}
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
							{t("consentDigital.header.navProcess")}
						</Link>
						<Link
							href="#preguntas"
							className="hidden text-sm font-medium text-zinc-400 transition-colors hover:text-white sm:block"
						>
							{t("consentDigital.header.navFaq")}
						</Link>
						<LanguageToggle variant="minimal" />
						<Link
							href="/"
							className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-sm font-bold text-slate-950 transition-all hover:brightness-110"
						>
							{t("consentDigital.header.ctaButton")}
							<ArrowRight className="h-4 w-4" aria-hidden="true" />
						</Link>
					</nav>
				</div>
			</header>

			<main
				id="main-content"
				className={cn(cosmicStyles.background, "min-h-screen pt-16")}
			>
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
											{PARK_STATS.rating}{" "}
											{t("consentDigital.stats.ratingLabel")}
										</span>
									</div>

									<h1 className="text-balance text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
										{t("consentDigital.hero.title1")}{" "}
										<span className="text-brand-green">
											{t("consentDigital.hero.title2")}
										</span>
									</h1>

									<p className="max-w-xl text-pretty text-lg leading-relaxed text-zinc-300">
										{t("consentDigital.hero.subtitle", {
											appName: APP_NAME,
										})}
									</p>

									<div className="flex flex-col gap-4 pt-2 sm:flex-row">
										<Link
											href="/"
											className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-8 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-brand-green/25 transition-all hover:brightness-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 focus:ring-offset-slate-950"
										>
											{t("consentDigital.hero.ctaPrimary")}
											<ChevronRight className="h-5 w-5" aria-hidden="true" />
										</Link>
										<Link
											href="#como-funciona"
											className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10"
										>
											{t("consentDigital.hero.ctaSecondary")}
										</Link>
										<a
											href={WHATSAPP_URL}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={t("consentDigital.hero.ctaWhatsAppAria")}
											className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-6 py-4 font-semibold text-brand-green transition-all hover:border-brand-green/50 hover:bg-brand-green/20"
										>
											{t("consentDigital.hero.ctaWhatsApp")}
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
													{t("consentDigital.stats.visitorsLabel")}
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
												<p className="text-xs text-zinc-400">
													{t("consentDigital.stats.trampolinesLabel")}
												</p>
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
											alt={t("consentDigital.hero.imageAlt", {
												appName: APP_NAME,
											})}
											width={400}
											height={400}
											priority
											sizes={PAGE_IMAGE_VARIANTS.kioskAstronaut.sizes}
											className="animate-float mx-auto h-auto w-full max-w-sm"
										/>
										<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
											<p className="text-center text-sm text-zinc-300">
												<strong className="text-white">
													{t("consentDigital.hero.imageCaption1", {
														count: PARK_STATS.trampolines,
													})}
												</strong>{" "}
												{t("consentDigital.hero.imageCaption2")}
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
									{t("consentDigital.process.title")}
								</h2>
								<p className="mt-4 text-lg text-zinc-400">
									{t("consentDigital.process.subtitle")}
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
									{t("consentDigital.process.requirementsTitle")}
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
									{t("consentDigital.benefits.title")}
								</h2>
								<p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
									{t("consentDigital.benefits.subtitle")}
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
									{t("consentDigital.faq.title")}
								</h2>
								<p className="mt-4 text-lg text-zinc-400">
									{t("consentDigital.faq.subtitle")}
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
										{t("consentDigital.about.title", { appName: APP_NAME })}
									</h2>
									<p className="mt-4 text-lg text-zinc-400">
										{t("consentDigital.about.description")}
									</p>

									<div className="mt-8 space-y-3">
										<h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
											{t("consentDigital.attractions.title")}
										</h3>
										<ul className="grid gap-2 sm:grid-cols-2">
											{[
												t("consentDigital.attractions.item1"),
												t("consentDigital.attractions.item2"),
												t("consentDigital.attractions.item3"),
												t("consentDigital.attractions.item4"),
												t("consentDigital.attractions.item5"),
												t("consentDigital.attractions.item6"),
											].map((attraction) => (
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
										{t("consentDigital.contact.title")}
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
													{t("consentDigital.mallName")}
												</p>
												<p className="text-sm text-zinc-400">
													{BUSINESS_STREET_ADDRESS}
												</p>
												<p className="text-sm text-zinc-400">
													{t("consentDigital.cityRegion")},{" "}
													{t("consentDigital.country")}
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
												<p className="text-sm text-zinc-400">
													{t("consentDigital.contact.callUs")}
												</p>
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
													{t("consentDigital.hours.weekdays")}
												</p>
												<p className="text-sm text-zinc-300">
													{t("consentDigital.hours.weekends")}
												</p>
											</div>
										</div>

										<div className="flex gap-3 pt-2">
											<a
												href={INSTAGRAM_URL}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-400"
												aria-label={t(
													"consentDigital.contact.followInstagramAria",
												)}
											>
												<Instagram className="h-4 w-4" aria-hidden="true" />
												Instagram
											</a>
											<a
												href={FACEBOOK_URL}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
												aria-label={t(
													"consentDigital.contact.followFacebookAria",
												)}
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
								{t("consentDigital.ctaFinal.title")}
							</h2>
							<p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
								{t("consentDigital.ctaFinal.subtitle")}
							</p>
							<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
								<Link
									href="/"
									className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-10 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-brand-green/25 transition-all hover:brightness-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 focus:ring-offset-slate-950"
								>
									{t("consentDigital.ctaFinal.buttonPrimary")}
									<ArrowRight className="h-5 w-5" aria-hidden="true" />
								</Link>
								<a
									href={WHATSAPP_URL}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={t("consentDigital.ctaFinal.buttonWhatsAppAria")}
									className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-10 py-4 text-lg font-bold text-brand-green transition-all hover:border-brand-green/50 hover:bg-brand-green/20"
								>
									{t("consentDigital.ctaFinal.buttonWhatsApp")}
								</a>
							</div>
							<p className="mt-6 text-sm text-zinc-500">
								{t("consentDigital.ctaFinal.timeNote")}
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
								alt={t("consentDigital.footer.logoAlt", { appName: APP_NAME })}
								width={140}
								height={40}
								loading="lazy"
								sizes={PAGE_IMAGE_VARIANTS.publicConsentLogo.sizes}
								className="h-10 w-auto"
							/>
							<p className="mt-4 text-sm text-zinc-500">
								{t("consentDigital.tagline")}
							</p>
							<p className="mt-2 text-sm text-zinc-500">
								{t("consentDigital.footer.tagline")}
							</p>
						</div>

						{/* Links */}
						<div>
							<h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
								{t("consentDigital.footer.quickLinks")}
							</h4>
							<ul className="space-y-2">
								<li>
									<Link
										href="/"
										className="text-sm text-zinc-500 hover:text-white"
									>
										{t("consentDigital.footer.linkStartRegistration")}
									</Link>
								</li>
								<li>
									<Link
										href="#como-funciona"
										className="text-sm text-zinc-500 hover:text-white"
									>
										{t("consentDigital.footer.linkHowItWorks")}
									</Link>
								</li>
								<li>
									<Link
										href="#preguntas"
										className="text-sm text-zinc-500 hover:text-white"
									>
										{t("consentDigital.footer.linkFaq")}
									</Link>
								</li>
							</ul>
						</div>

						{/* Contact */}
						<div>
							<h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
								{t("consentDigital.footer.contact")}
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
								{t("consentDigital.footer.followUs")}
							</h4>
							<div className="flex gap-3">
								<a
									href={INSTAGRAM_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-400"
									aria-label={t("consentDigital.footer.instagramAria")}
								>
									<Instagram className="h-5 w-5" aria-hidden="true" />
								</a>
								<a
									href={FACEBOOK_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
									aria-label={t("consentDigital.footer.facebookAria")}
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
							{t("consentDigital.footer.copyright", {
								year: new Date().getFullYear(),
								appName: APP_NAME,
							})}
						</p>
					</div>
				</div>
			</footer>
		</LanguageProvider>
	);
}
