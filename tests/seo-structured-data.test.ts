import { describe, expect, it } from "bun:test";

import {
  BUSINESS_LATITUDE,
  BUSINESS_LONGITUDE,
  BUSINESS_RATING_VALUE,
  BUSINESS_REVIEW_COUNT,
} from "@/lib/seo";
import {
  buildPublicPageStructuredData,
  buildPublicRobotsManifest,
  buildLlmsText,
} from "@/lib/seo";

// Helper: cast graph to a record array for test assertions
function graphAsRecords(
  result: ReturnType<typeof buildPublicPageStructuredData>,
): Array<Record<string, unknown>> {
  return (result["@graph"] as unknown) as Array<Record<string, unknown>>;
}

// ============================================================
// Phase 1.1: Constants
// ============================================================
describe("Phase 1.1: Business constants", () => {
  it("exports BUSINESS_LATITUDE as a number within valid range", () => {
    expect(typeof BUSINESS_LATITUDE).toBe("number");
    expect(BUSINESS_LATITUDE).toBeGreaterThan(-90);
    expect(BUSINESS_LATITUDE).toBeLessThan(90);
  });

  it("exports BUSINESS_LONGITUDE as a number within valid range", () => {
    expect(typeof BUSINESS_LONGITUDE).toBe("number");
    expect(BUSINESS_LONGITUDE).toBeGreaterThan(-180);
    expect(BUSINESS_LONGITUDE).toBeLessThan(180);
  });

  it("exports BUSINESS_RATING_VALUE as a string between 0 and 5", () => {
    const rating = Number.parseFloat(BUSINESS_RATING_VALUE);
    expect(rating).toBeGreaterThan(0);
    expect(rating).toBeLessThanOrEqual(5);
  });

  it("exports BUSINESS_REVIEW_COUNT as a positive integer string", () => {
    const count = Number.parseInt(BUSINESS_REVIEW_COUNT, 10);
    expect(count).toBeGreaterThan(0);
    expect(Number.isInteger(count)).toBe(true);
  });
});

// ============================================================
// Phase 1.2 + 1.3: Schema types (AmusementParkNode with geo, aggregateRating)
// ============================================================
describe("Phase 1.2-1.3: AmusementPark structured data", () => {
  it("builds structured data with AmusementPark type on homepage", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/",
      title: "Jumping Park - Parque de Trampolines",
      description: "El parque de trampolines mas grande de Villavicencio",
    });

    const graph = graphAsRecords(result);

    const parkNode = graph.find(
      (node) => node["@type"] === "AmusementPark",
    );
    expect(parkNode).toBeDefined();

    // Verify the old LocalBusiness type is NOT present
    const oldBusinessNode = graph.find(
      (node) => node["@type"] === "LocalBusiness",
    );
    expect(oldBusinessNode).toBeUndefined();

    // Verify required fields exist
    expect(parkNode?.name).toBeString();
    expect(parkNode?.url).toBeString();
    expect(parkNode?.telephone).toBeString();
    expect(parkNode?.["@id"]).toBeString();
  });

  it("includes GeoCoordinates in AmusementPark node", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/",
      title: "Jumping Park",
      description: "Parque de trampolines",
    });

    const graph = graphAsRecords(result);
    const parkNode = graph.find(
      (node) => node["@type"] === "AmusementPark",
    );
    const geo = parkNode?.geo as Record<string, unknown> | undefined;

    expect(geo).toBeDefined();
    expect(geo?.["@type"]).toBe("GeoCoordinates");
    expect(typeof geo?.latitude).toBe("number");
    expect(typeof geo?.longitude).toBe("number");
    expect(geo?.latitude).toBe(BUSINESS_LATITUDE);
    expect(geo?.longitude).toBe(BUSINESS_LONGITUDE);
  });

  it("includes AggregateRating in AmusementPark node", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/",
      title: "Jumping Park",
      description: "Parque de trampolines",
    });

    const graph = graphAsRecords(result);
    const parkNode = graph.find(
      (node) => node["@type"] === "AmusementPark",
    );
    const rating = parkNode?.aggregateRating as Record<string, unknown> | undefined;

    expect(rating).toBeDefined();
    expect(rating?.["@type"]).toBe("AggregateRating");
    expect(rating?.ratingValue).toBe(BUSINESS_RATING_VALUE);
    expect(rating?.reviewCount).toBe(BUSINESS_REVIEW_COUNT);
  });

  it("uses openingHoursSpecification instead of bare openingHours array", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/",
      title: "Jumping Park",
      description: "Parque de trampolines",
    });

    const graph = graphAsRecords(result);
    const parkNode = graph.find(
      (node) => node["@type"] === "AmusementPark",
    );
    const hours = parkNode?.openingHoursSpecification as Array<Record<string, unknown>> | undefined;

    expect(hours).toBeDefined();
    expect(hours?.length).toBeGreaterThan(0);

    // First entry should have @type, dayOfWeek, opens, closes
    const firstEntry = hours?.[0];
    expect(firstEntry?.["@type"]).toBe("OpeningHoursSpecification");
    expect(Array.isArray(firstEntry?.dayOfWeek)).toBe(true);
    expect(typeof firstEntry?.opens).toBe("string");
    expect(typeof firstEntry?.closes).toBe("string");
  });

  it("does NOT include AmusementPark on non-homepage paths", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/consentimiento-digital",
      title: "Consentimiento Digital",
      description: "Flujo de consentimiento",
    });

    const graph = graphAsRecords(result);
    const parkNode = graph.find(
      (node) => node["@type"] === "AmusementPark",
    );
    // AmusementPark is now included on all public pages
    expect(parkNode).toBeDefined();
  });
});

// ============================================================
// Phase 2.2-2.3: HowTo Schema
// ============================================================
describe("Phase 2: HowTo schema for registration flow", () => {
  it("includes HowTo schema in homepage JSON-LD graph", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/",
      title: "Jumping Park",
      description: "Parque de trampolines",
    });

    const graph = graphAsRecords(result);
    const howToNode = graph.find(
      (node) => node["@type"] === "HowTo",
    );

    expect(howToNode).toBeDefined();
    expect(howToNode?.name).toBeString();
    expect(howToNode?.description).toBeString();
  });

  it("HowTo schema has steps with name and text", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/",
      title: "Jumping Park",
      description: "Parque de trampolines",
    });

    const graph = graphAsRecords(result);
    const howToNode = graph.find(
      (node) => node["@type"] === "HowTo",
    );
    const steps = howToNode?.step as Array<Record<string, unknown>> | undefined;

    expect(steps).toBeDefined();
    expect(steps?.length).toBeGreaterThanOrEqual(3);

    for (const step of steps ?? []) {
      expect(step["@type"]).toBe("HowToStep");
      expect(step.name).toBeString();
      expect((step.name as string).length).toBeGreaterThan(0);
      expect(step.text).toBeString();
      expect((step.text as string).length).toBeGreaterThan(0);
    }
  });

  it("does NOT include HowTo schema on non-homepage paths", () => {
    const result = buildPublicPageStructuredData({
      pathname: "/consentimiento-digital",
      title: "Consentimiento Digital",
      description: "Flujo de consentimiento",
    });

    const graph = graphAsRecords(result);
    const howToNode = graph.find(
      (node) => node["@type"] === "HowTo",
    );
    expect(howToNode).toBeUndefined();
  });
});

// ============================================================
// Phase 3: AI Bot Access
// ============================================================
describe("Phase 3: AI bot access in robots.txt", () => {
  function getAllUserAgents(
    manifest: ReturnType<typeof buildPublicRobotsManifest>,
  ): string[] {
    if (Array.isArray(manifest.rules)) {
      return manifest.rules.flatMap((r) =>
        typeof r.userAgent === "string" ? [r.userAgent] : r.userAgent,
      );
    }
    return [];
  }

  function findRule(
    rules: ReturnType<typeof buildPublicRobotsManifest>["rules"],
    agent: string,
  ) {
    const ruleList = Array.isArray(rules) ? rules : [rules];
    return ruleList.find((r) => {
      const agents = typeof r.userAgent === "string" ? [r.userAgent] : r.userAgent;
      return agents?.includes(agent);
    });
  }

  const requiredBots = [
    "GPTBot",
    "ChatGPT-User",
    "anthropic-ai",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
    "Bingbot",
  ];

  it("allows all 7 required AI/search bots", () => {
    // Need PUBLIC_SEO_ENABLED to be true for public manifest
    const original = process.env.PUBLIC_SEO_ENABLED;
    process.env.PUBLIC_SEO_ENABLED = "true";
    try {
      const manifest = buildPublicRobotsManifest();
      const userAgents = getAllUserAgents(manifest);

      for (const bot of requiredBots) {
        expect(userAgents).toContain(bot);
      }
    } finally {
      if (original === undefined) {
        delete process.env.PUBLIC_SEO_ENABLED;
      } else {
        process.env.PUBLIC_SEO_ENABLED = original;
      }
    }
  });

  it("public paths are allowed for AI bots", () => {
    const original = process.env.PUBLIC_SEO_ENABLED;
    process.env.PUBLIC_SEO_ENABLED = "true";
    try {
      const manifest = buildPublicRobotsManifest();
      const rules = manifest.rules;

      const chatGptRule = findRule(rules, "ChatGPT-User");
      expect(chatGptRule).toBeDefined();
      expect(chatGptRule?.allow).toContain("/");
      expect(chatGptRule?.disallow).toContain("/admin/");

      const anthropicRule = findRule(rules, "anthropic-ai");
      expect(anthropicRule).toBeDefined();
      expect(anthropicRule?.allow).toContain("/");

      const bingRule = findRule(rules, "Bingbot");
      expect(bingRule).toBeDefined();
      expect(bingRule?.allow).toContain("/");
    } finally {
      if (original === undefined) {
        delete process.env.PUBLIC_SEO_ENABLED;
      } else {
        process.env.PUBLIC_SEO_ENABLED = original;
      }
    }
  });
});

// ============================================================
// Phase 4: llms.txt content
// ============================================================
describe("Phase 4: llms.txt enrichment", () => {
  it("includes business description section", () => {
    const content = buildLlmsText();
    expect(content).toContain("# Jumping Park");
    expect(content).toContain("## Public Summary");
  });

  it("includes pricing link", () => {
    const content = buildLlmsText();
    expect(content).toContain("/pricing.md");
    expect(content).toContain("pricing");
  });

  it("includes contact information (phone and address)", () => {
    const content = buildLlmsText();
    expect(content).toContain("Phone");
    expect(content).toContain("Address");
  });

  it("includes key public page URLs", () => {
    const content = buildLlmsText();
    expect(content).toContain("https://www.jumpingpark.lat/");
    expect(content).toContain("/consentimiento-digital");
  });

  it("returns valid markdown that is not empty", () => {
    const content = buildLlmsText();
    expect(content.length).toBeGreaterThan(200);
    expect(content).toContain("## ");
  });
});
