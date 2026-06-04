import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "bun:test";

const { GET: getLlmsText } = await import("@/app/llms.txt/route");
const {
	APP_URL,
	CONSENTIMIENTO_DIGITAL_PAGE_PATH,
	buildPublicRobotsManifest,
	createCanonicalUrl,
} = await import("@/lib/seo");

const AI_BOT_RULES = {
	GPTBOT: "GPTBot",
	CLAUDEBOT: "ClaudeBot",
	PERPLEXITYBOT: "PerplexityBot",
	GOOGLE_EXTENDED: "Google-Extended",
} as const;

function toRuleValueArray(value: string | readonly string[] | undefined): string[] {
	if (value === undefined) {
		return [];
	}

	if (typeof value === "string") {
		return [value];
	}

	return value.map((entry) => entry);
}

async function withEnv<T>(
	key: string,
	value: string | undefined,
	callback: () => Promise<T> | T,
): Promise<T> {
	const previousValue = process.env[key];

	if (value === undefined) {
		delete process.env[key];
	} else {
		process.env[key] = value;
	}

	try {
		return await callback();
	} finally {
		if (previousValue === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = previousValue;
		}
	}
}

describe("ai visibility surface", () => {
	it("serves llms.txt as plain text with canonical public guidance", async () => {
		const response = getLlmsText();
		const body = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"text/plain; charset=utf-8",
		);
		expect(body).toContain("# Jumping Park");
		expect(body).toContain(createCanonicalUrl(CONSENTIMIENTO_DIGITAL_PAGE_PATH));
		expect(body).toContain(`${APP_URL}/pricing.md`);
		expect(body).toContain("## Citation Guidance");
	});

	it("publishes a machine-readable pricing file without inventing prices", () => {
		expect(existsSync("public/pricing.md")).toBe(true);

		const pricingMarkdown = readFileSync("public/pricing.md", "utf8");

		expect(pricingMarkdown).toContain("# Pricing — Jumping Park");
		expect(pricingMarkdown).toContain("## Digital consent before arrival");
		expect(pricingMarkdown).toContain("Not publicly listed online");
		expect(pricingMarkdown).toContain("Ticket office at the park");
		expect(pricingMarkdown).toContain("Non-slip socks are mandatory for the attractions");
	});

	it("allows the approved AI bots on the public consent route when PUBLIC_SEO is on", async () => {
		await withEnv("PUBLIC_SEO_ENABLED", "true", () => {
			const manifest = buildPublicRobotsManifest();
			const rules = Array.isArray(manifest.rules) ? manifest.rules : [manifest.rules];

			for (const userAgent of Object.values(AI_BOT_RULES)) {
				const rule = rules.find((candidate) => candidate.userAgent === userAgent);

				expect(rule?.userAgent).toBe(userAgent);
				expect(toRuleValueArray(rule?.allow)).toContain(
					CONSENTIMIENTO_DIGITAL_PAGE_PATH,
				);
				expect(toRuleValueArray(rule?.disallow)).toContain("/admin/");
				expect(toRuleValueArray(rule?.disallow)).toContain("/api/");
			}
		});
	});

	it("falls back to a global disallow when PUBLIC_SEO is off", async () => {
		await withEnv("PUBLIC_SEO_ENABLED", "false", () => {
			const manifest = buildPublicRobotsManifest();
			const rules = Array.isArray(manifest.rules) ? manifest.rules : [manifest.rules];

			expect(rules.length).toBe(1);
			expect(rules[0]?.userAgent).toBe("*");
			expect(toRuleValueArray(rules[0]?.disallow)).toEqual(["/"]);
		});
	});
});
