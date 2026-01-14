import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// Usando `git rev-parse HEAD` para obtener una revisión única.
// Esto asegura que el SW se actualice cuando hay nuevos commits.
const revision =
	spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ?? crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
	additionalPrecacheEntries: [{ url: "/offline", revision }],
	swSrc: "src/app/sw.ts",
	// Copiar configuración relevante de Next.js si has cambiado alguna
	nextConfig: {},
});
