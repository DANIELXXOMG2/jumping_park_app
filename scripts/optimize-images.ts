import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { OPTIMIZABLE_IMAGE_ASSETS } from "../src/lib/imageOptimization";

const publicRoot = join(import.meta.dir, "../public");

function resolvePublicPath(assetPath: string): string {
	return join(publicRoot, assetPath.replace(/^\//, ""));
}

async function optimizeImage(sourcePath: string, outputPath: string, quality: number, maxWidth?: number) {
	const absoluteSourcePath = resolvePublicPath(sourcePath);
	const absoluteOutputPath = resolvePublicPath(outputPath);

	if (!existsSync(absoluteSourcePath)) {
		throw new Error(`Missing source image: ${sourcePath}`);
	}

	let pipeline = sharp(absoluteSourcePath);

	if (maxWidth !== undefined) {
		pipeline = pipeline.resize({
			fit: "inside",
			width: maxWidth,
			withoutEnlargement: true,
		});
	}

	await mkdir(dirname(absoluteOutputPath), { recursive: true });
	await pipeline.webp({ quality }).toFile(absoluteOutputPath);
}

async function main() {
	for (const asset of OPTIMIZABLE_IMAGE_ASSETS) {
		await optimizeImage(
			asset.sourcePath,
			asset.outputPath,
			asset.quality,
			asset.maxWidth,
		);
	}

	console.log("Optimized PNG/JPEG assets to WebP.");
}

await main();
