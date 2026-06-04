import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { AnimatedSection } from "@/components/public/AnimatedSection";
import cosmicStyles from "@/components/public/cosmic-bg.module.css";
import { SecretAdminTrigger } from "@/components/ui/SecretAdminTrigger";
import { PAGE_IMAGE_VARIANTS } from "@/lib/imageOptimization";
import { buildLandingMetadata } from "@/lib/landingSeo";
import { cn } from "@/lib/utils";
import {
	BUSINESS_OPENING_HOURS,
	BUSINESS_PHONE,
	buildPublicPageStructuredData,
} from "@/lib/seo";

export const metadata: Metadata = buildLandingMetadata();

const structuredData = buildPublicPageStructuredData({
	pathname: "/",
	title: "Jumping Park - Parque de Trampolines en Villavicencio",
	description:
		"Jumping Park es el parque de trampolines más grande de Villavicencio. Diversión segura para todas las edades.",
});

const ATTRACTIONS = [
	{
		label: "+50 camas elásticas",
		value: "Espacio amplio para saltar sin límites.",
	},
	{
		label: "Piscina de espuma",
		value: "Zona de salto con aterrizaje seguro y divertido.",
	},
	{
		label: "Muro de escalada",
		value: "Desafío vertical para todas las edades.",
	},
	{ label: "Zona infantil", value: "Área dedicada para los más pequeños." },
] as const;

export default function LandingPage() {
	return (
		<main
			className={cn(cosmicStyles.background, "min-h-screen px-6 py-16 text-zinc-50 sm:px-10 lg:px-16")}
		>
			<Script
				id="landing-jsonld"
				type="application/ld+json"
				strategy="afterInteractive"
			>
				{JSON.stringify(structuredData)}
			</Script>

			<article className="mx-auto flex max-w-6xl flex-col gap-10">
				{/* ═══ HERO ═══ */}
				<AnimatedSection sectionId="hero">
					<header className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl text-center">
						<SecretAdminTrigger redirectTo="/admin/login">
							<Image
								src={PAGE_IMAGE_VARIANTS.publicConsentLogo.src}
								alt="Jumping Park - Logo"
								width={200}
								height={57}
								priority
								sizes={PAGE_IMAGE_VARIANTS.publicConsentLogo.sizes}
								className="mx-auto h-auto w-40 object-contain drop-shadow-lg"
							/>
						</SecretAdminTrigger>
						<h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
							Jumping Park
						</h1>
						<p className="mx-auto max-w-2xl text-lg leading-8 text-zinc-100/90">
							El parque de trampolines más grande de Villavicencio. Diversión
							segura para todas las edades con más de 50 camas elásticas,
							piscina de espuma, muro de escalada y zona infantil.
						</p>
					</header>
				</AnimatedSection>

				{/* ═══ INFO ═══ */}
				<AnimatedSection sectionId="info">
					<section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
						<h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
							Horarios y Contacto
						</h2>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
								<p className="text-sm uppercase tracking-widest text-cyan-200">
									Teléfono
								</p>
								<p className="mt-2 text-lg font-semibold text-white">
									{BUSINESS_PHONE.replace("+57 ", "")}
								</p>
							</div>
							<div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
								<p className="text-sm uppercase tracking-widest text-cyan-200">
									Horarios
								</p>
								{BUSINESS_OPENING_HOURS.map((entry) => (
									<p
										key={entry}
										className="mt-1 text-sm leading-6 text-zinc-200"
									>
										{entry}
									</p>
								))}
							</div>
						</div>
					</section>
				</AnimatedSection>

				{/* ═══ ATTRACTIONS ═══ */}
				<AnimatedSection sectionId="attractions">
					<section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
						<h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
							Atracciones
						</h2>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							{ATTRACTIONS.map((item) => (
								<div
									key={item.label}
									className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4"
								>
									<p className="font-semibold text-white">{item.label}</p>
									<p className="mt-1 text-sm leading-6 text-zinc-200">
										{item.value}
									</p>
								</div>
							))}
						</div>
					</section>
				</AnimatedSection>

				{/* ═══ CTA ═══ */}
				<AnimatedSection sectionId="cta">
					<section className="rounded-[1.9rem] border border-cyan-200/10 bg-linear-to-r from-cyan-400/20 via-emerald-300/10 to-slate-950/70 p-8 shadow-2xl backdrop-blur-2xl text-center">
						<h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
							¿Listo para saltar?
						</h2>
						<p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-zinc-100/90">
							Completá tu registro en el kiosco y llegá al parque con todo
							listo. Menos filas, más diversión.
						</p>
						<Link
							href="/ingreso"
							className="mt-6 inline-block rounded-full bg-white px-8 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100"
						>
							Ingresar al Kiosco
						</Link>
					</section>
				</AnimatedSection>

				{/* ═══ FOOTER ═══ */}
				<footer className="text-center text-xs tracking-widest text-white/30">
					JUMPING PARK © {new Date().getFullYear()}
				</footer>
			</article>
		</main>
	);
}
