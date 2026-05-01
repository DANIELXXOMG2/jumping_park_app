# Proposal: Production Hardening GGA Recommit

## Intent

The `feat/production-hardening` branch contains ~160 files (111 modified, 17 added, 31 untracked, 2 deleted, 3 unstaged) that were committed **without** gga review. To maintain code quality and team accountability, we must revert the branch to the last gga-approved commit (`7d794c7`) and re-commit every change in micro-batches of 3–4 files, each passing mandatory gga review before commit. The actual hardening code is already complete in the working tree; this change is purely about the *process* of re-landing it safely.

## Scope

### In Scope
- Reset branch to `7d794c7` while preserving the working tree.
- Group ~160 files into ~40 logical micro-batches.
- Stage, review, fix, and commit each batch sequentially.
- Maintain a batch manifest tracking status per batch.

### Out of Scope
- No new feature development.
- No changes to the base branch (`main`).
- No modifications to gga review rules or CI pipeline.

## Capabilities

### New Capabilities
None — this is a process-only change; no new spec-level behavior is introduced.

### Modified Capabilities
None — the hardening code itself does not change; only the commit history is reconstructed.

## Approach

1. **Preserve working tree**: Stash or copy the current tree so no work is lost.
2. **Soft reset**: `git reset --soft 7d794c7` to unstage everything while keeping the working tree intact.
3. **Batch grouping**: Organize files by logical domain (lib utils → services → UI components → app routes → contexts/hooks/store/types → config/docs). Aim for 3–4 files per batch.
4. **Per-batch cycle**:
   - Stage the batch.
   - Run `bun run check` (format + lint + types + audit).
   - Request gga review.
   - Address feedback (if any).
   - Commit with a conventional commit message referencing the batch domain.
5. **Manifest tracking**: A simple markdown checklist in the change folder records each batch, its files, review status, and commit SHA.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `feat/production-hardening` branch history | Rewritten | All commits after `7d794c7` replaced by ~40 reviewed micro-commits. |
| `openspec/changes/production-hardening-gga-recommit/` | New | Batch manifest and tracking artifacts. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| gga review surfaces many defects per batch | Med | Budget extra time; fix real issues, do not bypass review. |
| Intermediate batches leave repo in inconsistent state | Low | Group files by dependency order (libs → services → UI → pages). |
| ~40 review cycles are time-consuming | High | Parallelize batch preparation; use focused, atomic commit messages. |
| Base branch (`main`) advances during recommit | Low | Freeze `main` merges or rebase at the end. |

## Rollback Plan

If the recommit process fails or becomes unmanageable, hard-reset the branch back to `7d794c7` and restore the full working tree from the initial stash/backup. No schema migrations or destructive operations are involved.

## Dependencies

- gga review availability for ~40 micro-batches.
- Agreement to freeze `feat/production-hardening` base merges during the process.

## Success Criteria

- [ ] Branch history from `7d794c7` to `HEAD` consists solely of gga-reviewed micro-commits.
- [ ] Every file in the original ~160 is present in at least one committed batch.
- [ ] `bun run check` passes at every commit.
- [ ] No functionality regressions relative to the pre-reset working tree.
