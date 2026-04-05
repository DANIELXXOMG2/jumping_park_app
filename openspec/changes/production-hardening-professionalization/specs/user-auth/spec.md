# User Authentication Specification

## Purpose
Transition to a more secure session model for administrators, reducing client-side dependence.

## Requirements

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
