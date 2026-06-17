import Image from "next/image";
import { HomepageContent } from "@/components/kiosk/HomepageContent";
import { HomepageHeroIsland } from "@/components/kiosk/HomepageHeroIsland";
import { LanguageToggle } from "@/components/kiosk/LanguageToggle";
import { StartActionButton } from "@/components/kiosk/StartActionButton";
import { SecretAdminTrigger } from "@/components/ui/SecretAdminTrigger";
import type { DictionaryKey } from "@/lib/i18n/dictionary";
import { PAGE_IMAGE_VARIANTS } from "@/lib/imageOptimization";

interface HomepageShellProps {
	t: (
		key: DictionaryKey,
		replacements?: Record<string, string | number>,
	) => string;
}

/**
 * HomepageShell — Server Component rendering the homepage structure.
 *
 * Contains:
 * - HomepageHeroIsland (client): decorative animations (SpaceBackground, astronaut, solar-system)
 * - Logo with SecretAdminTrigger (5-click admin access)
 * - CTA button and bounce indicator
 * - HomepageContent (client): all translatable text that re-renders on language toggle
 *
 * The server renders the initial HTML with the locale from the cookie (SEO).
 * After hydration, HomepageContent uses useLanguage() for instant language switching.
 */
export function HomepageShell({ t }: HomepageShellProps) {
	const ctaText = t("common.tapToStart");
	const ctaAriaLabel = t("common.tapToStartAria");
	const astronautAlt = t("home.hero.astronautAlt");
	const solarSystemAlt = t("home.hero.solarSystemAlt");

	return (
		<main
			id="main-content"
			className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground"
		>
			{/* Client island — SpaceBackground, astronaut, solar-system */}
			<HomepageHeroIsland
				astronautAlt={astronautAlt}
				solarSystemAlt={solarSystemAlt}
			/>

			{/* Content overlay (above SpaceBackground z-0 and overlay z-10) */}
			<div className="relative z-20 flex min-h-screen flex-col">
				{/* Language Toggle — positioned top-right */}
				<div className="absolute top-4 right-4 z-30">
					<LanguageToggle variant="premium" />
				</div>

				{/* Hero section — Logo, H1, CTA, Bounce */}
				<section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
					{/* Logo with 5-click admin trigger */}
					<div className="mb-8 animate-fade-in">
						<SecretAdminTrigger redirectTo="/admin/login">
							<Image
								src={PAGE_IMAGE_VARIANTS.kioskLogo.src}
								alt={t("home.hero.logoAlt")}
								width={280}
								height={100}
								priority
								sizes={PAGE_IMAGE_VARIANTS.kioskLogo.sizes}
								className="h-auto w-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:w-56 md:w-64 lg:w-72"
							/>
						</SecretAdminTrigger>
					</div>

					{/* H1 + Subtitle — rendered from server t() for SEO, updated by HomepageContent on toggle */}
					<h1 className="font-sora mb-6 text-6xl font-black uppercase leading-none tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-9xl">
						{t("home.title.line1")}
						<span className="mt-2 block bg-linear-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
							{t("home.title.line2")}
						</span>
					</h1>

					<p className="mb-12 max-w-xl text-xl font-light tracking-wide text-white/80 sm:text-2xl md:text-3xl">
						{t("home.subtitle")}
					</p>

					{/* CTA — client interactive button */}
					<div className="w-full max-w-2xl transform transition-transform duration-300 hover:scale-[1.02]">
						<StartActionButton ctaText={ctaText} ctaAriaLabel={ctaAriaLabel} />
					</div>

					{/* Bounce indicator */}
					<div className="mt-16 animate-bounce">
						<div className="mx-auto h-14 w-8 rounded-full border-2 border-white/30 p-1">
							<div className="h-3 w-full animate-pulse rounded-full bg-white/60" />
						</div>
					</div>
				</section>

				{/* Translatable content — re-renders on language toggle */}
				<HomepageContent />
			</div>
		</main>
	);
}
