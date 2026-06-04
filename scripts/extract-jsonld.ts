/**
 * extract-jsonld — Renders a public URL with Playwright and extracts JSON-LD structured data.
 *
 * Usage: bun run scripts/extract-jsonld.ts --url <URL>
 *
 * NOTE: Bun may timeout launching Playwright Chromium on Windows.
 * If that happens, run with Node directly:
 *   node --loader ts-node/esm scripts/extract-jsonld.ts --url <URL>
 *
 * Uses Playwright to render the page (handles client-side injected JSON-LD from
 * Next.js `<Script strategy="afterInteractive">`) and extracts all
 * `<script type="application/ld+json">` blocks from the live DOM.
 *
 * Also exports a pure `parseJsonLdFromHtml` function for testing without Playwright.
 *
 * Outputs detected schema types + raw JSON to stdout. Exits 1 on failure.
 */

import { chromium } from '@playwright/test'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractTypes(obj: Record<string, unknown>): string[] {
  const raw = obj['@type']
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((t) => String(t))
  return [String(raw)]
}

export interface JsonLdExtraction {
  date: string
  url: string
  types: string[]
  blocks: Record<string, unknown>[]
}

/**
 * Pure parser: extracts JSON-LD blocks from raw HTML string.
 * Testable without Playwright.
 */
export function parseJsonLdFromHtml(
  html: string,
  url: string,
): JsonLdExtraction {
  const regex =
    /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const blocks: Record<string, unknown>[] = []
  const types: string[] = []

  let match: RegExpExecArray | null
  regex.lastIndex = 0
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim()
    if (!raw) continue
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isRecord(parsed)) continue
      blocks.push(parsed)
      types.push(...extractTypes(parsed))
    } catch {
      // skip malformed blocks
    }
  }

  return {
    date: new Date().toISOString(),
    url,
    types,
    blocks,
  }
}

/**
 * Live URL extraction: renders with Playwright, then parses the live DOM.
 */
export async function extractJsonLd(url: string): Promise<JsonLdExtraction> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })

    const html = await page.content()
    return parseJsonLdFromHtml(html, url)
  } finally {
    await browser.close()
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const urlArg = Bun.argv.find((a) => a.startsWith('--url='))?.split('=')[1]
  if (!urlArg) {
    console.error('[extract-jsonld] Missing --url parameter')
    process.exit(1)
  }

  extractJsonLd(urlArg)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
      console.log()
      console.log('| Schema Type     | Detected |')
      console.log('|-----------------|----------|')
      if (result.types.length === 0) {
        console.log('| (none)          | ❌       |')
      } else {
        for (const t of result.types) {
          console.log(`| ${t} | ✅ |`)
        }
      }
    })
    .catch((error: unknown) => {
      console.error(
        '[extract-jsonld]',
        error instanceof Error ? error.message : String(error),
      )
      process.exit(1)
    })
}
