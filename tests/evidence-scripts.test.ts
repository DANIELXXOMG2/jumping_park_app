import { beforeAll, describe, expect, it, mock } from 'bun:test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(impl: (_input: string | URL | Request, _init?: RequestInit) => Promise<Response>) {
  mock.module('node:http', () => ({})) // prevent real network in Bun test
  globalThis.fetch = impl as typeof globalThis.fetch
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function makeTextResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain' },
  })
}

function makeHtmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html' },
  })
}

function makeXmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'application/xml' },
  })
}

function makeMdResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/markdown' },
  })
}

// ---------------------------------------------------------------------------
// 1.1 validate-pagespeed.ts
// ---------------------------------------------------------------------------

describe('validate-pagespeed', () => {
  let runPagespeed: (url: string, apiKey?: string) => Promise<{
    date: string
    url: string
    strategy: string
    performance: number
    lcp: number
    tbt: number
    cls: number
    seo: number
  }>

  beforeAll(async () => {
    const mod = await import('../scripts/validate-pagespeed')
    runPagespeed = mod.runPagespeed
  })

  it('returns PSI scores when API responds with valid data', async () => {
    const mockResponse = {
      lighthouseResult: {
        categories: {
          performance: { score: 0.92 },
          seo: { score: 0.85 },
        },
        audits: {
          'largest-contentful-paint': { numericValue: 1200 },
          'total-blocking-time': { numericValue: 45 },
          'cumulative-layout-shift': { numericValue: 0.03 },
        },
      },
    }

    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) =>
      makeJsonResponse(mockResponse),
    )

    const result = await runPagespeed('https://example.com', 'fake-key')

    expect(result.performance).toBe(92)
    expect(result.lcp).toBe(1200)
    expect(result.tbt).toBe(45)
    expect(result.cls).toBe(0.03)
    expect(result.seo).toBe(85)
    expect(result.url).toBe('https://example.com')
    expect(result.strategy).toBe('mobile')
    expect(result.date).toBeTruthy()
  })

  it('handles missing API key gracefully (anonymous quota path)', async () => {
    const mockResponse = {
      lighthouseResult: {
        categories: {
          performance: { score: 0.78 },
          seo: { score: 0.90 },
        },
        audits: {
          'largest-contentful-paint': { numericValue: 2500 },
          'total-blocking-time': { numericValue: 120 },
          'cumulative-layout-shift': { numericValue: 0.01 },
        },
      },
    }

    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) =>
      makeJsonResponse(mockResponse),
    )

    const result = await runPagespeed('https://example.com')

    expect(result.performance).toBe(78)
    expect(result.seo).toBe(90)
    expect(result.strategy).toBe('mobile')
  })

  it('throws error when PSI API returns non-200', async () => {
    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) =>
      makeJsonResponse({ error: { message: 'Quota exceeded' } }, 429),
    )

    await expect(runPagespeed('https://example.com', 'fake-key')).rejects.toThrow(
      /429/,
    )
  })

  it('throws error on network failure', async () => {
    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) => {
      throw new Error('ECONNREFUSED')
    })

    await expect(runPagespeed('https://example.com')).rejects.toThrow(
      /ECONNREFUSED/,
    )
  })
})

// ---------------------------------------------------------------------------
// 1.2 extract-jsonld.ts
// ---------------------------------------------------------------------------

describe('extract-jsonld', () => {
  let parseJsonLdFromHtml: (html: string, url: string) => {
    date: string
    url: string
    types: string[]
    blocks: Record<string, unknown>[]
  }

  beforeAll(async () => {
    const mod = await import('../scripts/extract-jsonld')
    parseJsonLdFromHtml = mod.parseJsonLdFromHtml
  })

  it('extracts JSON-LD blocks from valid HTML', () => {
    const html = `
      <html>
      <head>
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"LocalBusiness","name":"Jumping Park"}
        </script>
      </head>
      <body>
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}
        </script>
      </body>
      </html>
    `

    const result = parseJsonLdFromHtml(html, 'https://example.com')

    expect(result.types).toContain('LocalBusiness')
    expect(result.types).toContain('BreadcrumbList')
    expect(result.blocks).toHaveLength(2)
    expect(result.blocks[0]).toHaveProperty('@type', 'LocalBusiness')
    expect(result.url).toBe('https://example.com')
    expect(result.date).toBeTruthy()
  })

  it('extracts JSON-LD with nested objects across lines', () => {
    const html = `
      <html><head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Jumping Park",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1234567890"
        }
      }
      </script>
      </head></html>
    `

    const result = parseJsonLdFromHtml(html, 'https://example.com')

    expect(result.types).toEqual(['Organization'])
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0]).toHaveProperty('name', 'Jumping Park')
  })

  it('returns empty types when no JSON-LD blocks found', () => {
    const html = '<html><head></head><body><p>No structured data here</p></body></html>'

    const result = parseJsonLdFromHtml(html, 'https://example.com')

    expect(result.types).toEqual([])
    expect(result.blocks).toEqual([])
  })

  it('skips malformed JSON inside a JSON-LD block', () => {
    const html = `
      <html><head>
      <script type="application/ld+json">this is not valid json {{{</script>
      </head></html>
    `

    const result = parseJsonLdFromHtml(html, 'https://example.com')

    expect(result.types).toEqual([])
    expect(result.blocks).toEqual([])
  })

  it('handles mixed valid and invalid blocks', () => {
    const html = `
      <html><head>
      <script type="application/ld+json">not json</script>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Test"}</script>
      </head></html>
    `

    const result = parseJsonLdFromHtml(html, 'https://example.com')

    expect(result.types).toEqual(['WebSite'])
    expect(result.blocks).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// 1.3 validate-public-crawl.ts
// ---------------------------------------------------------------------------

describe('validate-public-crawl', () => {
  let runCrawl: (baseUrl: string) => Promise<{
    date: string
    baseUrl: string
    checks: {
      robotsTxt: { status: number; adminBlocked: boolean; pass: boolean }
      sitemap: { status: number; urlCount: number; pass: boolean }
      llmsTxt: { status: number; hasContent: boolean; pass: boolean }
      pricingMd: { status: number; hasContent: boolean; pass: boolean }
    }
  }>

  beforeAll(async () => {
    const mod = await import('../scripts/validate-public-crawl')
    runCrawl = mod.runCrawl
  })

  it('passes all checks when all public assets are healthy', async () => {
    let callCount = 0
    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) => {
      callCount++
      const url = typeof _input === 'string' ? _input : (_input as URL).toString()
      if (url.includes('robots.txt')) {
        return makeTextResponse(
          'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://example.com/sitemap.xml',
        )
      }
      if (url.includes('sitemap.xml')) {
        return makeXmlResponse(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url><url><loc>https://example.com/page</loc></url></urlset>',
        )
      }
      if (url.includes('llms.txt')) {
        return makeTextResponse('# Jumping Park\n\n## Citation Guidance\n\nGood content here.')
      }
      if (url.includes('pricing.md')) {
        return makeMdResponse('# Pricing — Jumping Park\n\n## Digital consent\n\nClear pricing info.')
      }
      return new Response('Not Found', { status: 404 })
    })

    const result = await runCrawl('https://example.com')

    expect(result.checks.robotsTxt.status).toBe(200)
    expect(result.checks.robotsTxt.adminBlocked).toBe(true)
    expect(result.checks.robotsTxt.pass).toBe(true)
    expect(result.checks.sitemap.status).toBe(200)
    expect(result.checks.sitemap.urlCount).toBe(2)
    expect(result.checks.sitemap.pass).toBe(true)
    expect(result.checks.llmsTxt.status).toBe(200)
    expect(result.checks.llmsTxt.hasContent).toBe(true)
    expect(result.checks.llmsTxt.pass).toBe(true)
    expect(result.checks.pricingMd.status).toBe(200)
    expect(result.checks.pricingMd.hasContent).toBe(true)
    expect(result.checks.pricingMd.pass).toBe(true)
    expect(result.baseUrl).toBe('https://example.com')
    expect(result.date).toBeTruthy()
  })

  it('reports missing llms.txt as non-blocking', async () => {
    let callCount = 0
    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) => {
      callCount++
      const url = typeof _input === 'string' ? _input : (_input as URL).toString()
      if (url.includes('robots.txt')) {
        return makeTextResponse(
          'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml',
        )
      }
      if (url.includes('sitemap.xml')) {
        return makeXmlResponse(
          '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>',
        )
      }
      if (url.includes('pricing.md')) {
        return makeMdResponse('# Pricing\n\nInfo.')
      }
      return new Response('Not Found', { status: 404 })
    })

    const result = await runCrawl('https://example.com')

    expect(result.checks.llmsTxt.status).toBe(404)
    expect(result.checks.llmsTxt.hasContent).toBe(false)
    expect(result.checks.llmsTxt.pass).toBe(false)
  })

  it('reports sitemap failure on malformed XML', async () => {
    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) => {
      const url = typeof _input === 'string' ? _input : (_input as URL).toString()
      if (url.includes('robots.txt')) {
        return makeTextResponse('User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml')
      }
      if (url.includes('sitemap.xml')) {
        return makeXmlResponse('<not-xml>unclosed', 200)
      }
      if (url.includes('llms.txt')) {
        return makeTextResponse('# OK')
      }
      if (url.includes('pricing.md')) {
        return makeMdResponse('# OK')
      }
      return new Response('Not Found', { status: 404 })
    })

    const result = await runCrawl('https://example.com')

    expect(result.checks.sitemap.status).toBe(200)
    expect(result.checks.sitemap.pass).toBe(false)
  })

  it('reports robots.txt failure when admin section is not blocked', async () => {
    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) => {
      const url = typeof _input === 'string' ? _input : (_input as URL).toString()
      if (url.includes('robots.txt')) {
        return makeTextResponse('User-agent: *\nAllow: /')
      }
      if (url.includes('sitemap.xml')) {
        return makeXmlResponse(
          '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>',
        )
      }
      if (url.includes('llms.txt')) {
        return makeTextResponse('# OK')
      }
      if (url.includes('pricing.md')) {
        return makeMdResponse('# OK')
      }
      return new Response('Not Found', { status: 404 })
    })

    const result = await runCrawl('https://example.com')

    expect(result.checks.robotsTxt.status).toBe(200)
    expect(result.checks.robotsTxt.adminBlocked).toBe(false)
  })

  it('handles network errors gracefully for individual checks', async () => {
    mockFetch(async (_input: string | URL | Request, _init?: RequestInit) => {
      const url = typeof _input === 'string' ? _input : (_input as URL).toString()
      if (url.includes('robots.txt')) {
        throw new Error('ECONNREFUSED')
      }
      if (url.includes('sitemap.xml')) {
        return makeXmlResponse(
          '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>',
        )
      }
      if (url.includes('llms.txt')) {
        return makeTextResponse('# OK')
      }
      if (url.includes('pricing.md')) {
        return makeMdResponse('# OK')
      }
      return new Response('Not Found', { status: 404 })
    })

    const result = await runCrawl('https://example.com')

    expect(result.checks.robotsTxt.status).toBe(0)
    expect(result.checks.robotsTxt.adminBlocked).toBe(false)
    expect(result.checks.robotsTxt.pass).toBe(false)
    expect(result.checks.sitemap.pass).toBe(true)
  })
})
