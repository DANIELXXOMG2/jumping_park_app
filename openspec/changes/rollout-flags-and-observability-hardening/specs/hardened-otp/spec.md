# Hardened OTP Specification

## Purpose
Defines the behavior of OTP generation and validation when gated by the `OTP_HARDENING_ENABLED` flag.

## Requirements

### Requirement: Hardening Enabled
The system MUST enforce OTP lockout and retry limits when the flag is enabled.

#### Scenario: OTP limits enforced
- GIVEN `OTP_HARDENING_ENABLED` is true
- WHEN a user exceeds max OTP attempts
- THEN the system rejects the request with a 429 Too Many Requests
- AND records the lockout state

### Requirement: Hardening Disabled (Fallback)
The system MUST bypass OTP strict limits when the flag is disabled to allow unconstrained testing or fallback.

#### Scenario: OTP limits bypassed
- GIVEN `OTP_HARDENING_ENABLED` is false
- WHEN a user makes excessive OTP requests
- THEN the system processes the requests without applying lockout mechanisms
- AND logs an observability marker indicating the hardening check was bypassed