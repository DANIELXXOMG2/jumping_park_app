/**
 * validate-pagespeed — Calls PageSpeed Insights API for a given URL.
 *
 * Usage: bun run scripts/validate-pagespeed.ts --url <URL>
 * Env:   PSI_API_KEY (optional — uses anonymous quota if absent)
 *
 * Outputs JSON + markdown table to stdout. Exits 1 on failure.
 */

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getScore(
  obj: Record<string, unknown>,
  key: string,
): number {
  const entry = obj[key]
  if (!isRecord(entry)) return 0
  const score = entry['score']
  return typeof score === 'number' ? score : 0
}

function getNumericValue(
  obj: Record<string, unknown>,
  key: string,
): number {
  const entry = obj[key]
  if (!isRecord(entry)) return 0
  const val = entry['numericValue']
  return typeof val === 'number' ? val : 0
}

export interface PSIResult {
  date: string
  url: string
  strategy: 'mobile' | 'desktop'
  performance: number
  lcp: number
  tbt: number
  cls: number
  seo: number
}

export async function runPagespeed(
  url: string,
  apiKey?: string,
): Promise<PSIResult> {
  const params = new URLSearchParams()
  params.set('url', url)
  params.set('strategy', 'mobile')
  if (apiKey) params.set('key', apiKey)
  params.append('category', 'performance')
  params.append('category', 'seo')
  params.append('category', 'accessibility')
  params.append('category', 'best-practices')
  const endpoint = `${PSI_BASE}?${params.toString()}`

  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(
      `PSI API returned HTTP ${String(response.status)}: ${await response.text()}`,
    )
  }

  const rawData: unknown = await response.json()
  if (!isRecord(rawData)) {
    throw new Error('PSI API returned unexpected response shape')
  }

  const lh = isRecord(rawData['lighthouseResult'])
    ? rawData['lighthouseResult']
    : undefined
  const rawCategories = lh && isRecord(lh['categories']) ? lh['categories'] : undefined
  const rawAudits = lh && isRecord(lh['audits']) ? lh['audits'] : undefined
  const categories: Record<string, unknown> = rawCategories ?? {}
  const audits: Record<string, unknown> = rawAudits ?? {}

  const performance = Math.round(getScore(categories, 'performance') * 100)
  const seo = Math.round(getScore(categories, 'seo') * 100)
  const lcp = getNumericValue(audits, 'largest-contentful-paint')
  const tbt = getNumericValue(audits, 'total-blocking-time')
  const cls = getNumericValue(audits, 'cumulative-layout-shift')

  return {
    date: new Date().toISOString(),
    url,
    strategy: 'mobile',
    performance,
    lcp,
    tbt,
    cls,
    seo,
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const urlArg = Bun.argv.find((a) => a.startsWith('--url='))?.split('=')[1]
  if (!urlArg) {
    console.error('[validate-pagespeed] Missing --url parameter')
    process.exit(1)
  }

  runPagespeed(urlArg, process.env.PSI_API_KEY)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
      console.log()
      console.log('| Metric      | Value |')
      console.log('|-------------|-------|')
      console.log(`| Performance | ${String(result.performance)}/100 |`)
      console.log(`| LCP         | ${String(result.lcp)}ms |`)
      console.log(`| TBT         | ${String(result.tbt)}ms |`)
      console.log(`| CLS         | ${String(result.cls)} |`)
      console.log(`| SEO         | ${String(result.seo)}/100 |`)
    })
    .catch((error: unknown) => {
      console.error(
        '[validate-pagespeed]',
        error instanceof Error ? error.message : String(error),
      )
      process.exit(1)
    })
}
