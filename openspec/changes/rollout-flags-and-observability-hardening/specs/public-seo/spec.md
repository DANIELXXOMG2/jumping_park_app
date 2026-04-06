# Public SEO Specification

## Purpose
Defines the visibility of the application to search engines gated by the `PUBLIC_SEO_ENABLED` flag.

## Requirements

### Requirement: SEO Enabled
The system MUST output permissive crawling directives when SEO is enabled.

#### Scenario: Search engines allowed
- GIVEN `PUBLIC_SEO_ENABLED` is true
- WHEN a bot requests `robots.txt` or metadata
- THEN the system returns `Allow: /` and indexable `<meta>` tags

### Requirement: SEO Disabled
The system MUST actively prevent indexing when SEO is disabled.

#### Scenario: Search engines blocked
- GIVEN `PUBLIC_SEO_ENABLED` is false
- WHEN a bot requests `robots.txt` or metadata
- THEN the system returns `Disallow: /` and `noindex, nofollow` metadata