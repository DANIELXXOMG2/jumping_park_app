# SEO Public Specification

## Purpose
Create a public, SEO and AI-SEO optimized surface separated from operational routes.

## Requirements

### Requirement: Technical SEO Foundation
The public surface MUST provide standard SEO artifacts.

#### Scenario: Search engine crawler visits the site
- GIVEN a deployed application
- WHEN a crawler requests `/robots.txt` and `/sitemap.xml`
- THEN the system MUST return valid files
- AND MUST include valid JSON-LD structured data on public landing pages.

### Requirement: Operational Route Privacy
The system MUST prevent indexing of transactional and administrative routes.

#### Scenario: Crawler accesses the kiosk flow
- GIVEN a crawler requests paths under `/(kiosk)` or `/admin`
- WHEN the page is served
- THEN the response MUST include a `X-Robots-Tag: noindex, nofollow` header
- AND the `<meta name="robots" content="noindex, nofollow">` tag MUST be present.
