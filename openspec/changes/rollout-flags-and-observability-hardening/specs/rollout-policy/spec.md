# Rollout Policy Specification

## Purpose
Defines the central typed runtime policy for resolving and observing feature flags related to hardening.

## Requirements

### Requirement: Flag Resolution
The system MUST resolve feature flags from environment variables with a safe fallback.

#### Scenario: Flag enabled explicitly
- GIVEN `OTP_HARDENING_ENABLED` is set to "true"
- WHEN the policy module is queried for OTP hardening
- THEN it returns true

#### Scenario: Flag missing or malformed
- GIVEN an environment variable is omitted or invalid
- WHEN the policy module is queried
- THEN it defaults to true (secure by default)
- AND logs a warning about the fallback

### Requirement: Observability Logging
The system MUST provide deterministic observability markers for enabled/disabled mode decisions.

#### Scenario: Operation uses gated feature
- GIVEN a request to a gated endpoint
- WHEN the policy evaluates the flag
- THEN a standardized log entry is emitted indicating `feature_name` and `status` (enabled/disabled)