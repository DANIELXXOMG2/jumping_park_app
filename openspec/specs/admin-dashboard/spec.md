# Admin Dashboard Specification

## Purpose
Define the admin dashboard behavior required to keep Firebase usage cost-efficient, operationally observable, and securely auditable while preserving the current production architecture.

## Requirements

### Requirement: Cost-Efficient Pagination
Admin modules MUST enforce cursor-based pagination to prevent unbound Firebase read costs.

#### Scenario: Admin paginates through Users or Consents
- GIVEN an admin is viewing a list of users, consents, or minors
- WHEN they navigate to the next page
- THEN the system MUST fetch 20-50 records using a cursor
- AND latency MUST remain under 500ms
- AND the cost exposure MUST NOT exceed standard free-tier limits (< $0.015 / 1k requests).

### Requirement: Pre-Aggregated Statistics
Dashboard metrics MUST be pre-calculated to eliminate full-table scans.

#### Scenario: Admin loads the Dashboard
- GIVEN an admin navigates to the Dashboard
- WHEN the dashboard statistics are requested
- THEN the system MUST read from 1-5 pre-aggregated statistic documents
- AND latency MUST remain under 300ms
- AND the operation MUST incur negligible read costs (< $0.001 / 1k requests).

### Requirement: Security and Audit Trail
Admin routes MUST be secured and actions strictly audited.

#### Scenario: Admin performs an action
- GIVEN an authenticated admin accesses the dashboard
- WHEN they view or mutate data
- THEN the system MUST enforce strict CSP (Content Security Policy) and security headers
- AND maintain an immutable audit trail of the action.
