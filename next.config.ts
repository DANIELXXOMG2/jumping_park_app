import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Configuración limpia de Next.js 16
  // PWA removido - manifest.json se sirve nativamente desde /public
};

export default withBundleAnalyzer(nextConfig);
