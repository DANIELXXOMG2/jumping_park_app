# Delta for kiosk-flow

## ADDED Requirements

### Requirement: Configurable OTP Code Expiration
The system MUST allow operators to configure the OTP code expiration time via an environment variable `OTP_EXPIRATION_MINUTES`, falling back to 60 minutes if omitted, non-numeric, or <= 0.

#### Scenario: Default OTP expiration
- GIVEN `OTP_EXPIRATION_MINUTES` is not set or is invalid
- WHEN a user requests an OTP code
- THEN the OTP code MUST expire in 60 minutes

#### Scenario: Custom OTP expiration
- GIVEN `OTP_EXPIRATION_MINUTES` is set to a valid positive integer (e.g., 30)
- WHEN a user requests an OTP code
- THEN the OTP code MUST expire in 30 minutes

### Requirement: Configurable OTP Session Duration
The system MUST allow operators to configure the validated OTP session duration via an environment variable `OTP_SESSION_DURATION_MINUTES`, falling back to 120 minutes if omitted, non-numeric, or <= 0.

#### Scenario: Default session duration
- GIVEN `OTP_SESSION_DURATION_MINUTES` is not set or is invalid
- WHEN a user successfully validates an OTP code
- THEN the resulting session MUST be valid for 120 minutes

#### Scenario: Custom session duration
- GIVEN `OTP_SESSION_DURATION_MINUTES` is set to a valid positive integer (e.g., 240)
- WHEN a user successfully validates an OTP code
- THEN the resulting session MUST be valid for 240 minutes
