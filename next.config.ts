import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
	// Requerido para @serwist/turbopack (usa esbuild-wasm internamente)
	serverExternalPackages: ["esbuild-wasm"],
};

export default withBundleAnalyzer(nextConfig);
