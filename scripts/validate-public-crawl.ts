/**
 * validate-public-crawl — Checks public-facing SEO/infrastructure assets.
 *
 * Usage: bun run scripts/validate-public-crawl.ts --url <BASE_URL>
 *
 * Validates:
 *   - robots.txt   (200, admin area blocked)
 *   - sitemap.xml  (valid XML, url count)
 *   - llms.txt     (exists, has content)
 *   - pricing.md   (exists, has content)
 *
 * Outputs JSON + markdown table to stdout. Exits 1 if any critical check fails.
 */

interface CheckResult {
  status: number
  pass: boolean
}

interface RobotsCheck extends CheckResult {
  adminBlocked: boolean
}

interface SitemapCheck extends CheckResult {
  urlCount: number
}

interface ContentCheck extends CheckResult {
  hasContent: boolean
}

export interface CrawlResult {
  date: string
  baseUrl: string
  checks: {
    robotsTxt: RobotsCheck
    sitemap: SitemapCheck
    llmsTxt: ContentCheck
    pricingMd: ContentCheck
  }
}

function normalizeUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

async function fetchSafe(url: string): Promise<{ status: number; body: string }> {
  try {
    const response = await fetch(url)
    return { status: response.status, body: await response.text() }
  } catch {
    return { status: 0, body: '' }
  }
}

async function checkRobots(baseUrl: string): Promise<RobotsCheck> {
  const { status, body } = await fetchSafe(`${baseUrl}/robots.txt`)
  const adminBlocked = /^\s*Disallow\s*:\s*\/admin\//im.test(body)
  return { status, adminBlocked, pass: status === 200 && adminBlocked }
}

async function checkSitemap(baseUrl: string): Promise<SitemapCheck> {
  const { status, body } = await fetchSafe(`${baseUrl}/sitemap.xml`)
  let urlCount = 0
  let validXml = false
  if (status === 200 && body.length > 0) {
    try {
      const urlMatches = body.match(/<url>/g)
      urlCount = urlMatches ? urlMatches.length : 0
      validXml = body.includes('<?xml') || body.includes('<urlset') || body.includes('<sitemapindex')
    } catch {
      // invalid XML
    }
  }
  return { status, urlCount, pass: status === 200 && validXml }
}

async function checkContentAsset(
  baseUrl: string,
  path: string,
): Promise<ContentCheck> {
  const { status, body } = await fetchSafe(`${baseUrl}/${path}`)
  const hasContent = status === 200 && body.trim().length > 0
  return { status, hasContent, pass: hasContent }
}

async function checkLlmTxt(baseUrl: string): Promise<ContentCheck> {
  return checkContentAsset(baseUrl, 'llms.txt')
}

async function checkPricingMd(baseUrl: string): Promise<ContentCheck> {
  return checkContentAsset(baseUrl, 'pricing.md')
}

export async function runCrawl(baseUrl: string): Promise<CrawlResult> {
  const normalized = normalizeUrl(baseUrl)

  const [robotsTxt, sitemap, llmsTxt, pricingMd] = await Promise.all([
    checkRobots(normalized),
    checkSitemap(normalized),
    checkLlmTxt(normalized),
    checkPricingMd(normalized),
  ])

  return {
    date: new Date().toISOString(),
    baseUrl: normalized,
    checks: { robotsTxt, sitemap, llmsTxt, pricingMd },
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const urlArg = Bun.argv.find((a) => a.startsWith('--url='))?.split('=')[1]
  if (!urlArg) {
    console.error('[validate-public-crawl] Missing --url parameter')
    process.exit(1)
  }

  runCrawl(urlArg)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
      console.log()
      console.log('| Asset        | Status | Details          | Pass |')
      console.log('|--------------|--------|------------------|------|')
      console.log(
        `| robots.txt   | ${String(result.checks.robotsTxt.status)} | admin blocked: ${result.checks.robotsTxt.adminBlocked ? 'yes' : 'no'} | ${result.checks.robotsTxt.pass ? '✅' : '❌'} |`,
      )
      console.log(
        `| sitemap.xml  | ${String(result.checks.sitemap.status)} | ${String(result.checks.sitemap.urlCount)} URLs | ${result.checks.sitemap.pass ? '✅' : '❌'} |`,
      )
      console.log(
        `| llms.txt     | ${String(result.checks.llmsTxt.status)} | has content: ${result.checks.llmsTxt.hasContent ? 'yes' : 'no'} | ${result.checks.llmsTxt.pass ? '✅' : '❌'} |`,
      )
      console.log(
        `| pricing.md   | ${String(result.checks.pricingMd.status)} | has content: ${result.checks.pricingMd.hasContent ? 'yes' : 'no'} | ${result.checks.pricingMd.pass ? '✅' : '❌'} |`,
      )

      const allPassed = Object.values(result.checks).every((c) => c.pass)
      if (!allPassed) {
        process.exit(1)
      }
    })
    .catch((error: unknown) => {
      console.error(
        '[validate-public-crawl]',
        error instanceof Error ? error.message : String(error),
      )
      process.exit(1)
    })
}
