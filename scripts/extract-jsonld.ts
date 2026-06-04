/**
 * extract-jsonld — Fetches a public URL and extracts JSON-LD structured data.
 *
 * Usage: bun run scripts/extract-jsonld.ts --url <URL>
 *
 * Outputs detected schema types + raw JSON to stdout. Exits 1 on failure.
 */

const JSON_LD_REGEX = /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

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

export async function extractJsonLd(url: string): Promise<JsonLdExtraction> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Fetch returned HTTP ${String(response.status)} for ${url}`,
    )
  }

  const html = await response.text()
  const blocks: Record<string, unknown>[] = []
  const types: string[] = []

  let match: RegExpExecArray | null
  JSON_LD_REGEX.lastIndex = 0
  while ((match = JSON_LD_REGEX.exec(html)) !== null) {
    const raw = match[1].trim()
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isRecord(parsed)) {
        throw new Error('JSON-LD block is not an object')
      }
      blocks.push(parsed)
      types.push(...extractTypes(parsed))
    } catch {
      throw new Error(
        `Malformed JSON in JSON-LD block at position ${String(match.index)}`,
      )
    }
  }

  return {
    date: new Date().toISOString(),
    url,
    types,
    blocks,
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
