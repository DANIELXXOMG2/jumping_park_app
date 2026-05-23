import type { Metadata } from "next";
import {
	buildPublicSeoPolicy,
	buildRobotsMetadataFromPolicy,
	buildSiteVerification,
} from "@/lib/seo";

export function generateMetadata(): Metadata {
	const publicSeoPolicy = buildPublicSeoPolicy();

	return {
		robots: buildRobotsMetadataFromPolicy(publicSeoPolicy),
		verification: buildSiteVerification(publicSeoPolicy),
	};
}

export default function PublicLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return children;
}
