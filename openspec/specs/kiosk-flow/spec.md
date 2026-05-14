# Kiosk Flow Specification

## Purpose
Define the kiosk flow behavior required for accessible, zoom-safe, and quality-gated public consent interactions.

## Requirements

### Requirement: WCAG Screen Reader Support
The kiosk interface MUST be fully navigable and comprehensible for blind and visually impaired users.

#### Scenario: Blind user navigates the consent flow
- GIVEN a user relies on a screen reader
- WHEN they interact with the kiosk flow
- THEN all interactive elements MUST have valid ARIA labels
- AND dynamic content changes MUST be announced via ARIA live regions
- AND the flow MUST be fully keyboard-navigable.

### Requirement: Responsive Zoom and Reflow
The kiosk MUST NOT block user-initiated zoom and MUST support text reflow without breaking functionality.

#### Scenario: Low-vision user zooms the interface
- GIVEN a user accesses the kiosk via a mobile or desktop browser
- WHEN they apply pinch-to-zoom or browser text zoom up to 200%
- THEN the application MUST NOT restrict zoom (e.g., no `maximum-scale=1`)
- AND the layout MUST reflow linearly without horizontal scrolling or clipping.

### Requirement: Automated Quality Gates
All code changes to the kiosk flow MUST pass rigorous automated quality checks.

#### Scenario: Developer pushes code
- GIVEN a developer commits changes to the repository
- WHEN the CI/CD pipeline runs
- THEN the code MUST pass Axe accessibility checks, Biome formatting/linting, strict TypeScript checks, and Knip dead-code audits before merging.
