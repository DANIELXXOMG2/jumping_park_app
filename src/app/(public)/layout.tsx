import type { Metadata } from "next";
import { buildPublicRobotsMetadata, buildSiteVerification } from "@/lib/seo";

export function generateMetadata(): Metadata {
	return {
		robots: buildPublicRobotsMetadata(),
		verification: buildSiteVerification(),
	};
}

export default function PublicLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return children;
}
