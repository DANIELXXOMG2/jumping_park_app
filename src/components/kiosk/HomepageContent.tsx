"use client";

import { Clock, FileText, MapPin, Phone, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { BUSINESS_PHONE } from "@/lib/seo";

const INSTAGRAM_URL = "https://www.instagram.com/jumpingparkvillavo/";
const WHATSAPP_URL = `https://wa.me/${BUSINESS_PHONE.replace(/[\s+]/g, "")}`;

/**
 * HomepageContent — Client component for translatable homepage text.
 *
 * Uses useLanguage() so content re-renders instantly on language toggle
 * without requiring a page reload. Server-side initial render uses the
 * locale cookie for SEO; client hydration takes over for interactive updates.
 */
export function HomepageContent() {
	const { t } = useLanguage();

	return (
		<>
			{/* HERO TEXT */}
			<section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
				<h1 className="font-sora mb-6 text-6xl font-black uppercase leading-none tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-9xl">
					{t("home.title.line1")}
					<span className="mt-2 block bg-linear-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
						{t("home.title.line2")}
					</span>
				</h1>

				<p className="mb-12 max-w-xl text-xl font-light tracking-wide text-white/80 sm:text-2xl md:text-3xl">
					{t("home.subtitle")}
				</p>
			</section>

			{/* ATRACCIONES */}
			<section className="px-6 py-12">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
						{t("home.attractions.title")}
					</h2>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
						<div className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 p-6 text-center backdrop-blur-sm">
							<span className="text-4xl" aria-hidden="true">
								🤸
							</span>
							<h3 className="text-lg font-semibold text-white">
								{t("home.attractions.trampolines")}
							</h3>
							<p className="text-sm text-white/70">
								{t("home.attractions.trampolinesDesc")}
							</p>
						</div>
						<div className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 p-6 text-center backdrop-blur-sm">
							<span className="text-4xl" aria-hidden="true">
								🧸
							</span>
							<h3 className="text-lg font-semibold text-white">
								{t("home.attractions.kids")}
							</h3>
							<p className="text-sm text-white/70">
								{t("home.attractions.kidsDesc")}
							</p>
						</div>
						<div className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 p-6 text-center backdrop-blur-sm">
							<span className="text-4xl" aria-hidden="true">
								🟡
							</span>
							<h3 className="text-lg font-semibold text-white">
								{t("home.attractions.ballPit")}
							</h3>
							<p className="text-sm text-white/70">
								{t("home.attractions.ballPitDesc")}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* INFO DEL NEGOCIO */}
			<section className="px-6 py-12">
				<div className="mx-auto max-w-4xl grid grid-cols-1 gap-8 sm:grid-cols-3">
					<div className="flex flex-col items-center gap-3 text-center text-white/70">
						<MapPin className="h-6 w-6 text-primary" />
						<p className="text-sm leading-6">{t("home.business.address")}</p>
					</div>
					<div className="flex flex-col items-center gap-3 text-center text-white/70">
						<Phone className="h-6 w-6 text-[#25D366]" />
						<a
							href={WHATSAPP_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-medium text-[#25D366] hover:text-[#20BD5A] transition-colors"
						>
							{t("home.business.phone")}
						</a>
						<Link
							href={INSTAGRAM_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-primary hover:underline"
						>
							{t("home.business.instagramLabel")} {t("home.business.instagram")}
						</Link>
					</div>
					<div className="flex flex-col items-center gap-3 text-center text-white/70">
						<Clock className="h-6 w-6 text-primary" />
						<p className="text-sm leading-6">
							{t("home.business.hours.weekday")}
						</p>
						<p className="text-sm leading-6">
							{t("home.business.hours.weekend")}
						</p>
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
					{t("home.footer.copyright")} {new Date().getFullYear()}
				</p>
			</footer>
		</>
	);
}
