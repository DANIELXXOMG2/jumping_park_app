# Code Review Rules

## General
- Use Bun-based workflows and commands.
- Keep changes truthful to current implementation.
- Prefer small, focused commits.

## TypeScript
- Keep TypeScript strict.
- Do not introduce `any`.
- Reuse shared types and schemas.

## Next.js / React
- Keep route handlers thin and service-driven.
- Prefer server-safe configuration handling.
- Preserve accessibility behavior in kiosk/admin flows.

## Repository Hygiene
- Do not commit secrets or local-only artifacts.
- Keep docs aligned with the implementation they describe.
