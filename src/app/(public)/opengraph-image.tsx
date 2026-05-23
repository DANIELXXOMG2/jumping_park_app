import { ImageResponse } from "next/og";
import {
	CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_ALT,
	CONSENTIMIENTO_DIGITAL_PAGE_PATH,
} from "@/lib/consentimientoDigitalSeo";
import { APP_NAME } from "@/lib/seo";

const PAGE_URL = `https://www.jumpingpark.lat${CONSENTIMIENTO_DIGITAL_PAGE_PATH}`;

export const alt = CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_ALT;
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
					"linear-gradient(135deg, #09090b 0%, #18181b 45%, #052e2b 100%)",
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
						"radial-gradient(circle at top left, rgba(52, 211, 153, 0.38), transparent 38%), radial-gradient(circle at top right, rgba(168, 85, 247, 0.28), transparent 28%)",
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
				<div
					style={{
						border: "1px solid rgba(255,255,255,0.16)",
						borderRadius: "999px",
						color: "#a7f3d0",
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
							fontSize: 76,
							fontWeight: 900,
							lineHeight: 1.05,
						}}
					>
						Consentimiento digital claro, rapido y listo antes de saltar.
					</div>
					<div
						style={{
							color: "#d4d4d8",
							fontSize: 34,
							lineHeight: 1.35,
						}}
					>
						Validacion OTP, firma segura y experiencia premium para adultos y
						menores.
					</div>
				</div>
				<div
					style={{
						alignItems: "center",
						display: "flex",
						gap: "18px",
					}}
				>
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
