# Data Export Specification

## Purpose
Enforce strict limits and optimizations on bulk data downloads to prevent excessive database costs and secure signed URLs.

## Requirements

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
