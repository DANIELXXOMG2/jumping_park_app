# Specification: Production Hardening & Professionalization

## System Security

### Requirement: OTP Rate Limiting
The system MUST limit the number of OTP requests and validation attempts per user identifier within a time window.
#### Scenario: User requests too many OTPs
- GIVEN a user at the kiosk
- WHEN they request more than 3 OTPs in 5 minutes for the same document ID
- THEN the system MUST reject the request with HTTP 429 Too Many Requests
- AND return a clear error message indicating the cooldown period
#### Scenario: User brute-forces OTP validation
- GIVEN a valid OTP session
- WHEN a user submits incorrect OTP codes 5 consecutive times
- THEN the system MUST lock out the session
- AND subsequent validation attempts MUST fail with an explicit "Session locked" error

### Requirement: Perimeter Security Headers
The system MUST serve strict security headers on all responses.
#### Scenario: Browser requests a page
- GIVEN an active deployment
- WHEN a client requests any page or API route
- THEN the response MUST include headers such as Content-Security-Policy, X-Frame-Options (DENY), and Strict-Transport-Security.

## Observability

### Requirement: Secure Logging
The system MUST NOT log sensitive Personally Identifiable Information (PII) or secrets.
#### Scenario: Authentication failure is logged
- GIVEN an OTP validation failure
- WHEN the system logs the error
- THEN the log MUST NOT contain the plain text OTP or the full email address
- AND MUST only contain non-identifying telemetry (e.g., masked email `a***@example.com`).

### Requirement: Repository Documentation
The repository MUST contain a comprehensive README and `.env.example` file.
#### Scenario: New developer onboarding
- GIVEN a new developer cloning the repository
- WHEN they view the repository root
- THEN a `.env.example` MUST exist with all required keys (without secrets)
- AND the `README.md` MUST describe runbooks, required scripts, and architecture overview.

## SEO Public

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

## User Authentication

### Requirement: Secure Admin Sessions
The system MUST protect admin routes using secure server-validated sessions instead of relying solely on client-side state.
#### Scenario: Admin accesses protected route
- GIVEN a user requesting an `/admin/*` route
- WHEN the request is received
- THEN the system MUST validate a secure HttpOnly cookie or strictly verified JWT claim
- AND reject the request with HTTP 401 if the token is invalid, expired, or missing.
#### Scenario: Session Expiration
- GIVEN an authenticated admin user
- WHEN their session exceeds the maximum idle timeout
- THEN the system MUST invalidate the session
- AND redirect the user to the admin login page.

## Data Export

### Requirement: Bounded Data Exports
The system MUST NOT allow unrestricted bulk exports of the database.
#### Scenario: Admin requests a massive export
- GIVEN an authenticated admin
- WHEN they request an export spanning more than 30 days of data
- THEN the system MUST reject the request or enforce pagination
- AND return a message requiring a narrower date range.

### Requirement: Short-Lived Signed URLs
The system MUST generate Firebase Storage signed URLs with strict expiration times.
#### Scenario: Generating a consent PDF link
- GIVEN a request for a signed consent PDF
- WHEN the signed URL is generated
- THEN the URL MUST expire within a maximum of 15 minutes
- AND MUST NOT be accessible after expiration.
