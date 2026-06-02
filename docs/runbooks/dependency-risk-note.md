# Dependency risk note

## Current status

Reference date: `2026-04-06`

- `next` was updated from `16.0.7` to `16.2.6` to remove the direct vulnerabilities reported by `bun audit` from the gate.
- `firebase` was updated from `12.6.0` to `12.11.0`, and `firebase-admin` from `13.6.0` to `13.7.0`, as low-risk direct upgrades.
- Current result: `bun audit` no longer reports vulnerabilities in direct runtime dependencies, but it DOES keep residual transitive/tooling risk. That is the current state that `docs/README.md` and `docs/runbooks/production-hardening.md` must repeat without reinterpretation.

## Residual risk accepted for now

### Transitive runtime

- `node-forge`, `jws`, and `@tootallnate/once` still enter through the `firebase-admin` / `@google-cloud/storage` tree.
- No manual override was applied to those packages in this phase because we do not want to force unvalidated combinations into the Firebase/Admin SDK chain.

### Transitive tooling / CI

- `smol-toml` via `knip`
- `ajv`, `brace-expansion`, `minimatch`, `flatted` via `eslint`
- `picomatch` via `dependency-cruiser`, `knip`, `eslint-config-next`, and `jscpd`

These findings primarily affect development/CI tooling, not the production runtime served to users.

## Active mitigations

- CI now blocks if `bun audit` reports a vulnerability again in a direct dependency (`(direct dependency)`).
- The audit job still shows the full report so transitive/tooling debt does not get hidden.
- Pending upgrades should be attempted through official upstream releases first; avoid aggressive overrides unless you have a controlled reproduction and dedicated verification.

## Recommended next step

1. Review `firebase-admin` / `@google-cloud/storage` releases and remove this residual risk as soon as upstream publishes patched ranges.
2. Re-evaluate whether vulnerable tooling should move to non-blocking jobs or to newer major versions in a dedicated maintenance phase.
3. Keep `bun audit` recorded in verify/apply while this runbook still exists.
