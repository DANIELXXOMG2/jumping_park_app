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
 * Also exports detectDeadAssets for local repo hygiene checks.
 *
 * Outputs JSON + markdown table to stdout. Exits 1 if any critical check fails.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

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

// ---------------------------------------------------------------------------
// Dead Asset Detection (Slice 5)
// ---------------------------------------------------------------------------

export interface DeadAssetCheck {
  file: string
  referencedInSrc: boolean
  size: number
  action: 'keep' | 'remove' | 'ignore'
}

/** Files referenced by browser convention or standard, not code. */
const KNOWN_GOOD_PUBLIC_FILES = new Set([
  'favicon.ico',
  'favicon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  'pricing.md',
  'llms.txt',
  'og-image.png',
  'offline-sw.js',
])

function isReferencedInSrc(filename: string, srcDir: string): boolean {
  if (!existsSync(srcDir)) return false

  function scanDir(dir: string): boolean {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue
        if (scanDir(fullPath)) return true
      } else if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) {
        const content = readFileSync(fullPath, 'utf8')
        if (content.includes(filename)) return true
      }
    }
    return false
  }

  return scanDir(srcDir)
}

export function detectDeadAssets(
  publicDir: string,
  srcDir: string,
): DeadAssetCheck[] {
  const results: DeadAssetCheck[] = []

  function walk(dir: string): void {
    if (!existsSync(dir)) return
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const stats = statSync(fullPath)
        const referenced = isReferencedInSrc(entry.name, srcDir)
        let action: DeadAssetCheck['action']

        if (referenced) {
          action = 'keep'
        } else if (KNOWN_GOOD_PUBLIC_FILES.has(entry.name)) {
          action = 'ignore'
        } else {
          action = 'remove'
        }

        results.push({
          file: entry.name,
          referencedInSrc: referenced,
          size: stats.size,
          action,
        })
      }
    }
  }

  walk(publicDir)
  return results
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
