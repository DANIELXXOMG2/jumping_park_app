import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { LANDING_OPEN_GRAPH_ALT } from "@/lib/landingSeo";
import { APP_NAME, createCanonicalUrl } from "@/lib/seo";

const PAGE_URL = createCanonicalUrl("/");

// Read and inline the logo as a data URL so Satori can render it at build time.
const logoPath = join(
	process.cwd(),
	"public",
	"assets",
	"jumping-park-logo-optimized.png",
);
const logoBase64 = readFileSync(logoPath).toString("base64");
const logoSrc = `data:image/png;base64,${logoBase64}`;

export const alt = LANDING_OPEN_GRAPH_ALT;
export const size = {
	height: 630,
	width: 1200,
} as const;
export const contentType = "image/png";

export default function OpenGraphImage() {
	return new ImageResponse(
		<div
			style={{
				alignItems: "stretch",
				background:
					"linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #0c1929 100%)",
				color: "#f8fafc",
				display: "flex",
				height: "100%",
				padding: "56px 64px",
				position: "relative",
				width: "100%",
			}}
		>
			<div
				style={{
					background:
						"radial-gradient(circle at top left, rgba(56, 189, 248, 0.32), transparent 38%), radial-gradient(circle at top right, rgba(250, 204, 21, 0.24), transparent 28%)",
					inset: 0,
					position: "absolute",
				}}
			/>
			<div
				style={{
					alignItems: "flex-start",
					display: "flex",
					flexDirection: "column",
					gap: "22px",
					justifyContent: "space-between",
					position: "relative",
					width: "100%",
				}}
			>
				{/* Brand badge */}
				<div
					style={{
						border: "1px solid rgba(255,255,255,0.16)",
						borderRadius: "999px",
						color: "#facc15",
						display: "flex",
						fontSize: 22,
						fontWeight: 700,
						letterSpacing: "0.18em",
						padding: "14px 22px",
						textTransform: "uppercase",
					}}
				>
					{APP_NAME}
				</div>

				{/* Headline + Subtitle */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "18px",
						maxWidth: 880,
					}}
				>
					<div
						style={{
							fontSize: 72,
							fontWeight: 900,
							lineHeight: 1.05,
						}}
					>
						Parque de Trampolines en Villavicencio
					</div>
					<div
						style={{
							color: "#d4d4d8",
							fontSize: 34,
							lineHeight: 1.35,
						}}
					>
						Diversion segura para todas las edades. Lunes a viernes 1:30pm-8pm,
						sabados y domingos 11am-8pm.
					</div>
				</div>

				{/* Logo + URL */}
				<div
					style={{
						alignItems: "center",
						display: "flex",
						gap: "24px",
					}}
				>
					<img
						src={logoSrc}
						alt={`${APP_NAME} logo`}
						width={120}
						height={43}
						style={{
							borderRadius: "8px",
							objectFit: "contain",
						}}
					/>
					<div
						style={{
							background: "rgba(255,255,255,0.08)",
							border: "1px solid rgba(255,255,255,0.12)",
							borderRadius: "26px",
							color: "#e4e4e7",
							display: "flex",
							fontSize: 24,
							padding: "14px 20px",
						}}
					>
						{PAGE_URL}
					</div>
				</div>
			</div>
		</div>,
		{
			...size,
		},
	);
}
