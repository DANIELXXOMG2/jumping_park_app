# Design: Git Corrupted Working Copy Reapply Workflow

## Technical Approach

Use a **clean-clone, ordered reapply** workflow. The source-of-truth is the already-reviewed file state in the corrupted workspace, but the execution surface is the fresh clone. Work moves in four batches with hard stop/go gates between them so later traceability artifacts never certify unverified runtime state.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Batch ordering | Apply Docs/Hygiene -> Env/OTP -> Production Hardening -> OpenSpec/Traceability | Copy everything at once; move OpenSpec earlier | Earlier batches reduce blast radius first, runtime proof happens before traceability, and Batch 4 reflects the verified final state instead of guesses. |
| Scope boundary per batch | Keep each batch limited to its declared file families; do not “helpfully” pull adjacent files unless a gate proves they are required | Opportunistic copy while working through failures | Prevents hidden corruption and keeps rollback localized when a copied file introduces drift. |
| Verification model | Use progressive gates: targeted proof for narrow batches, full suite only after Batch 3, final repo hygiene gate after Batch 4 | Full `bun run check` after every batch; no intermediate gates | Matches cost/risk: early docs and OTP batches can be proven with smaller checks, while runtime/system integrity must wait until the full app surface is restored. |
| Batch 4 behavior | Keep Batch 4 structural-only and truthful | Modify runtime/docs broadly during traceability restore | Batch 4 is an audit trail restore, not a second implementation pass. If traceability needs runtime edits, that means the earlier batch boundary was wrong. |

## Data Flow

```text
Corrupted working tree
        |
        v
Inventory files by batch
        |
        v
Fresh clone -> Batch 1 copy -> Gate 1
           -> Batch 2 copy -> Gate 2
           -> Batch 3 copy -> Gate 3
           -> Batch 4 copy -> Gate 4 -> Final integration gate
```

Sequence rules:
1. Inventory source files before copying.
2. Copy only the current batch into the clean clone.
3. Run that batch’s gate.
4. If the gate fails, fix within the same batch boundary or revert the batch.
5. Only after Gate 3 passes may Batch 4 restore OpenSpec/spec/archive artifacts.
6. Final verify checks the whole repository state, not just Batch 4 artifacts.

## File Changes

| File | Action | Description |
|---|---|---|
| `openspec/changes/git-corrupted-reapply-workflow/design.md` | Create | Defines the execution model, boundaries, and gates for the reapply workflow. |

## Interfaces / Contracts

Workflow contract:

- **Batch 1 — Docs / Hygiene / Diagrams**: `README.md`, repo guidance, docs, diagrams, repo-hygiene support files.
- **Batch 2 — Env / OTP Timing**: env contract, OTP timing helper/wiring, focused operator docs, related tests.
- **Batch 3 — Production Hardening**: runtime/app code, Firebase IaC, Playwright/CI, dependency contract, rollout-safe config.
- **Batch 4 — OpenSpec / Traceability**: `openspec/config.yaml`, main specs, active change artifacts, archive truthfulness fixes.

Gate contract:

- **Gate 1**: docs truthfulness/path sanity; full `bun run check` may remain pending.
- **Gate 2**: targeted OTP tests + `bun run check:types`; env/docs must match code.
- **Gate 3**: strongest runtime proof (`bun test` scoped/full as available), Playwright a11y smoke, CI/dependency/IaC structure aligned.
- **Gate 4**: OpenSpec traceability proof + `bun run check:types`; no runtime scope expansion.
- **Final integration gate**: `bun run check`, clean working tree, and git-log review before closing the workflow.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit / structural | Batch-specific file truthfulness and artifact presence | Bun tests such as docs, OTP timing, production artifact, and OpenSpec traceability proofs. |
| Integration-style | Service/route/runtime slices restored by Batch 3 | Reuse the existing Bun suites already copied from source truth. |
| E2E | Accessibility-critical browser smoke once runtime surface exists | Run Playwright only after Batch 3 restores the required app/test harness. |

## Migration / Rollout

No data migration required. Rollout is the workflow itself: restore low-risk artifacts first, restore runtime next, restore traceability last. Rollback stays batch-local by discarding the failing batch changes in the clean clone.

## Open Questions

- [ ] None blocking; remaining work is operational completion of commits and the final integration gate already tracked in `tasks.md`.
