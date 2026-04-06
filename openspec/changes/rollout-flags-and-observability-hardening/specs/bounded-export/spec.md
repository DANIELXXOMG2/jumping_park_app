# Bounded Export Specification

## Purpose
Defines the behavior of admin data export operations when gated by the `EXPORT_BOUNDS_ENFORCED` flag.

## Requirements

### Requirement: Export Bounds Enforced
The system MUST enforce strict date range and size bounds on exports when enabled.

#### Scenario: Bounds check passes
- GIVEN `EXPORT_BOUNDS_ENFORCED` is true
- WHEN an admin requests a 30-day data export
- THEN the system fulfills the request

#### Scenario: Bounds check fails
- GIVEN `EXPORT_BOUNDS_ENFORCED` is true
- WHEN an admin requests a 1-year data export
- THEN the system rejects the request with a 400 Bad Request

### Requirement: Export Bounds Disabled (Fallback)
The system MUST allow unbounded exports when the flag is disabled.

#### Scenario: Unbounded export allowed
- GIVEN `EXPORT_BOUNDS_ENFORCED` is false
- WHEN an admin requests a 1-year data export
- THEN the system processes the large export request
- AND logs an observability marker indicating bounds were bypassed