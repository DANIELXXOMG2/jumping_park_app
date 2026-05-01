import { NextResponse } from "next/server";
import { buildLlmsText } from "@/lib/seo";

export function GET() {
	return new NextResponse(buildLlmsText(), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
