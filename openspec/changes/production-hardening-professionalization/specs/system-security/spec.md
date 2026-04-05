# System Security Specification

## Purpose
Hardening the platform perimeter, implementing advanced rate limiting, and preventing OTP abuse.

## Requirements

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
