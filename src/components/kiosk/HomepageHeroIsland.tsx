"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { PAGE_IMAGE_VARIANTS } from "@/lib/imageOptimization";

const SpaceBackground = dynamic(
	() =>
		import("@/components/kiosk/SpaceBackground").then((m) => m.SpaceBackground),
	{ ssr: false },
);

interface HomepageHeroIslandProps {
	/** Translated astronaut alt text */
	astronautAlt: string;
	/** Translated solar system alt text */
	solarSystemAlt: string;
}

/**
 * HomepageHeroIsland — Client-side island containing decorative
 * and animated hero elements (canvas background, astronaut, solar system).
 *
 * Interactive elements (CTA, bounce) are in HomepageShell for correct DOM order.
 */
export function HomepageHeroIsland({
	astronautAlt,
	solarSystemAlt,
}: HomepageHeroIslandProps) {
	return (
		<>
			<SpaceBackground />

			<div
				className="absolute inset-0 z-10 bg-linear-to-b from-black/40 via-transparent to-black/60"
				aria-hidden="true"
			/>

			<section className="flex flex-1 flex-col items-center justify-center px-6 text-center relative">
				{/* Decorative blur divs */}
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
							alt={astronautAlt}
							width={500}
							height={625}
							loading="lazy"
							sizes={PAGE_IMAGE_VARIANTS.kioskAstronaut.sizes}
							className="animate-float drop-shadow-[0_0_60px_rgba(139,92,246,0.5)] w-40 h-auto opacity-50 xs:w-48 xs:opacity-60 sm:w-56 sm:opacity-70 md:w-64 md:opacity-80 lg:w-80 lg:opacity-100 xl:w-96 2xl:w-[480px]"
						/>
					</div>
				</div>

				{/* Sistema Solar */}
				<div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none translate-x-[35%] sm:translate-x-[38%] md:translate-x-[40%] lg:translate-x-[40%]">
					<div className="relative">
						<div className="solar-system-mask relative overflow-hidden">
							<Image
								src="/assets/solar-system.webp"
								alt={solarSystemAlt}
								width={2000}
								height={1560}
								loading="lazy"
								className="h-auto min-w-[600px] opacity-60 mix-blend-screen md:opacity-50"
							/>
						</div>
						<div className="absolute inset-0 bg-linear-to-l from-transparent via-[#111C59]/20 to-transparent blur-2xl" />
					</div>
				</div>
			</section>
		</>
	);
}
