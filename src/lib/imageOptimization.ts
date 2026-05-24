type NextImageFormat = "image/avif" | "image/webp";

interface ImageAssetPaths {
	readonly astronautOptimizedWebp: string;
	readonly astronautSourcePng: string;
	readonly logoOptimizedWebp: string;
	readonly logoSourcePng: string;
}

interface PublicImageSizes {
	readonly kioskAstronaut: string;
	readonly kioskLogo: string;
	readonly publicConsentLogo: string;
}

interface PageImageVariant {
	readonly sizes: string;
	readonly src: string;
}

interface PageImageVariants {
	readonly kioskAstronaut: PageImageVariant;
	readonly kioskLogo: PageImageVariant;
	readonly publicConsentLogo: PageImageVariant;
}

export const NEXT_IMAGE_FORMATS: readonly NextImageFormat[] = [
	"image/avif",
	"image/webp",
];

export const NEXT_IMAGE_QUALITIES: readonly number[] = [80, 85];

export const IMAGE_ASSET_PATHS: ImageAssetPaths = {
	astronautOptimizedWebp: "/assets/astronauta.webp",
	astronautSourcePng: "/assets/astronauta.png",
	logoOptimizedWebp: "/assets/jumping-park-logo.webp",
	logoSourcePng: "/assets/jumping-park-logo.png",
};

export const PUBLIC_IMAGE_SIZES: PublicImageSizes = {
	kioskAstronaut:
		"(max-width: 475px) 160px, (max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1280px) 320px, 480px",
	kioskLogo: "(max-width: 640px) 192px, (max-width: 1024px) 256px, 288px",
	publicConsentLogo: "(max-width: 640px) 128px, 144px",
};

export const PAGE_IMAGE_VARIANTS: PageImageVariants = {
	kioskAstronaut: {
		sizes: PUBLIC_IMAGE_SIZES.kioskAstronaut,
		src: IMAGE_ASSET_PATHS.astronautOptimizedWebp,
	},
	kioskLogo: {
		sizes: PUBLIC_IMAGE_SIZES.kioskLogo,
		src: IMAGE_ASSET_PATHS.logoOptimizedWebp,
	},
	publicConsentLogo: {
		sizes: PUBLIC_IMAGE_SIZES.publicConsentLogo,
		src: IMAGE_ASSET_PATHS.logoOptimizedWebp,
	},
};

export interface OptimizableImageAsset {
	readonly maxWidth?: number;
	readonly outputPath: string;
	readonly quality: number;
	readonly sourcePath: string;
}

export const OPTIMIZABLE_IMAGE_ASSETS: readonly OptimizableImageAsset[] = [
	{
		outputPath: IMAGE_ASSET_PATHS.logoOptimizedWebp,
		quality: 85,
		sourcePath: IMAGE_ASSET_PATHS.logoSourcePng,
		maxWidth: 500,
	},
	{
		outputPath: IMAGE_ASSET_PATHS.astronautOptimizedWebp,
		quality: 85,
		sourcePath: IMAGE_ASSET_PATHS.astronautSourcePng,
		maxWidth: 500,
	},
];
