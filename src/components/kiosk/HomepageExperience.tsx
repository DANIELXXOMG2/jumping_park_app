"use client";

import { Clock, FileText, MapPin, Phone, Shield, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SpaceBackground } from "@/components/kiosk/SpaceBackground";
import { StartActionButton } from "@/components/kiosk/StartActionButton";
import { SecretAdminTrigger } from "@/components/ui/SecretAdminTrigger";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_IMAGE_VARIANTS } from "@/lib/imageOptimization";

const BUSINESS_INFO = {
	address:
		"Centro Comercial Primavera Urbana, Locales 313-317, Calle 15 #40-01, Villavicencio, Meta",
	phone: "+57 312 2594245",
	instagram: "@jumpingparkvillavo",
	instagramUrl: "https://www.instagram.com/jumpingparkvillavo/",
	hours: [
		"Lunes a Viernes: 1:30 p.m. - 8:00 p.m.",
		"Sábados, Domingos y Festivos: 11:00 a.m. - 8:00 p.m.",
	],
} as const;

export function HomepageExperience() {
	const { t } = useLanguage();

	return (
		<main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
			<SpaceBackground />

			<div
				className="absolute inset-0 z-10 bg-linear-to-b from-black/40 via-transparent to-black/60"
				aria-hidden="true"
			/>

			<div className="relative z-20 flex min-h-screen flex-col">
				{/* HERO */}
				<section className="flex flex-1 flex-col items-center justify-center px-6 text-center relative">
					<div
						className="pointer-events-none absolute inset-0 overflow-hidden"
						aria-hidden="true"
					>
						<div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/10 blur-3xl" />
						<div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl delay-1000" />
					</div>

					{/* Astronauta */}
					<div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none -translate-x-[30%] xs:-translate-x-[20%] sm:-translate-x-[10%] md:translate-x-0 md:left-2 lg:left-8 xl:left-20 2xl:left-32">
						<div className="relative">
							<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 h-6 xs:w-32 xs:h-7 sm:w-40 sm:h-8 md:w-48 md:h-10 lg:w-64 lg:h-12 bg-black/30 rounded-full blur-xl animate-float-shadow" />
							<Image
								src={PAGE_IMAGE_VARIANTS.kioskAstronaut.src}
								alt="Astronauta flotando"
								width={500}
								height={625}
								sizes={PAGE_IMAGE_VARIANTS.kioskAstronaut.sizes}
								className="animate-float drop-shadow-[0_0_60px_rgba(139,92,246,0.5)] w-40 h-auto opacity-50 xs:w-48 xs:opacity-60 sm:w-56 sm:opacity-70 md:w-64 md:opacity-80 lg:w-80 lg:opacity-100 xl:w-96 2xl:w-[480px]"
							/>
						</div>
					</div>

					{/* Sistema Solar */}
					<div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none translate-x-[35%] sm:translate-x-[38%] md:translate-x-[40%] lg:translate-x-[40%]">
						<div className="relative">
							<div
								className="relative overflow-hidden"
								style={{
									maskImage:
										"radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 70%), linear-gradient(to right, transparent 0%, black 25%, black 100%)",
									WebkitMaskImage:
										"radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 70%), linear-gradient(to right, transparent 0%, black 25%, black 100%)",
									maskComposite: "intersect",
									WebkitMaskComposite: "source-in",
								}}
							>
								<Image
									src="/assets/solar-system.png"
									alt="Sistema Solar"
									width={2000}
									height={1560}
									className="h-auto min-w-[600px] opacity-60 mix-blend-screen md:opacity-50"
								/>
							</div>
							<div className="absolute inset-0 bg-linear-to-l from-transparent via-[#111C59]/20 to-transparent blur-2xl" />
						</div>
					</div>

					{/* Logo */}
					<div className="mb-8 animate-fade-in">
						<SecretAdminTrigger redirectTo="/admin/login">
							<Image
								src={PAGE_IMAGE_VARIANTS.kioskLogo.src}
								alt="Jumping Park - Logo"
								width={280}
								height={100}
								priority
								sizes={PAGE_IMAGE_VARIANTS.kioskLogo.sizes}
								className="h-auto w-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:w-56 md:w-64 lg:w-72"
							/>
						</SecretAdminTrigger>
					</div>

					{/* Título */}
					<h1 className="font-sora mb-6 text-6xl font-black uppercase leading-none tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-9xl">
						{t("home.title.line1")}
						<span className="mt-2 block bg-linear-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
							{t("home.title.line2")}
						</span>
					</h1>

					<p className="mb-12 max-w-xl text-xl font-light tracking-wide text-white/80 sm:text-2xl md:text-3xl">
						{t("home.subtitle")}
					</p>

					{/* CTA */}
					<div className="w-full max-w-2xl transform transition-transform duration-300 hover:scale-[1.02]">
						<StartActionButton />
					</div>

					<div className="mt-16 animate-bounce">
						<div className="mx-auto h-14 w-8 rounded-full border-2 border-white/30 p-1">
							<div className="h-3 w-full animate-pulse rounded-full bg-white/60" />
						</div>
					</div>
				</section>

				{/* INFO DEL NEGOCIO */}
				<section className="px-6 py-12">
					<div className="mx-auto max-w-4xl grid grid-cols-1 gap-8 sm:grid-cols-3">
						<div className="flex flex-col items-center gap-3 text-center text-white/70">
							<MapPin className="h-6 w-6 text-primary" />
							<p className="text-sm leading-6">{BUSINESS_INFO.address}</p>
						</div>
						<div className="flex flex-col items-center gap-3 text-center text-white/70">
							<Phone className="h-6 w-6 text-primary" />
							<p className="text-sm">{BUSINESS_INFO.phone}</p>
							<Link
								href={BUSINESS_INFO.instagramUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-primary hover:underline"
							>
								Instagram: {BUSINESS_INFO.instagram}
							</Link>
						</div>
						<div className="flex flex-col items-center gap-3 text-center text-white/70">
							<Clock className="h-6 w-6 text-primary" />
							{BUSINESS_INFO.hours.map((entry) => (
								<p key={entry} className="text-sm leading-6">
									{entry}
								</p>
							))}
						</div>
					</div>
				</section>

				{/* FOOTER */}
				<footer className="px-6 pb-8">
					<div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 sm:gap-12 md:justify-between">
						<div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
							<Shield className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
							<span className="text-sm font-medium tracking-wide sm:text-base">
								{t("home.benefit.secure")}
							</span>
						</div>
						<div
							className="hidden h-6 w-px bg-white/20 md:block"
							aria-hidden="true"
						/>
						<div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
							<Zap className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
							<span className="text-sm font-medium tracking-wide sm:text-base">
								{t("home.benefit.fast")}
							</span>
						</div>
						<div
							className="hidden h-6 w-px bg-white/20 md:block"
							aria-hidden="true"
						/>
						<div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
							<FileText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
							<span className="text-sm font-medium tracking-wide sm:text-base">
								{t("home.benefit.digital")}
							</span>
						</div>
					</div>
					<p className="mt-6 text-center text-xs tracking-widest text-white/30">
						JUMPING PARK © {new Date().getFullYear()}
					</p>
				</footer>
			</div>
		</main>
	);
}
