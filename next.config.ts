import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { NEXT_IMAGE_FORMATS, NEXT_IMAGE_QUALITIES } from "./src/lib/imageOptimization";

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
	// Requerido para @serwist/turbopack (usa esbuild-wasm internamente)
	images: {
		formats: [...NEXT_IMAGE_FORMATS],
		qualities: [...NEXT_IMAGE_QUALITIES],
	},
	serverExternalPackages: ["esbuild-wasm"],
};

export default withBundleAnalyzer(nextConfig);
