# Git history targeted purge runbook

This runbook documents the safe, coordinated path for removing the final recommended purge set from Git history. The filename stays `git-history-mp4-purge.md` for continuity, but the rewrite scope is broader than the two MP4s. It is procedural on purpose: this PR does **not** run the rewrite.

## Quick path

1. Freeze merges and announce a history rewrite window.
2. Run `bun run scripts/git-history-mp4-precheck.ts` and capture `git count-objects -vH` as the before-state evidence.
3. Create a **fresh clone** dedicated to the rewrite, install `git filter-repo`, and remove the approved purge candidate paths from history.
4. Verify the paths no longer appear in `git rev-list --objects --all` and that clone weight drops.
5. Force-push the rewritten refs during the approved window, then require fresh clones for every contributor.

## Details

| Topic | Decision |
| --- | --- |
| Purge candidates | `public/assets/hero-video.mp4`, `public/assets/hero-opt.mp4`, `package-lock.json`, `diagramas/Diagrama-Secuencia.svg`, `diagramas/Diagrama-de-Entidad-Relacion.svg` |
| Purge rationale | Remove the stale heavyweight media plus stale/generated artifacts identified by the rewrite-readiness audit |
| Rewrite tool | `git filter-repo` |
| Safety default | Use `bun run scripts/git-history-mp4-precheck.ts` first; it only reads history metadata |
| Execution location | A fresh clone created only for the rewrite |
| Rollback artifact | Keep an external bundle or untouched mirror clone; do **not** keep backup refs in `origin` |

## Dry-run / precheck

Use the support script in the current repo to confirm the exact purge candidate set and current pack size:

```bash
bun run scripts/git-history-mp4-precheck.ts
git count-objects -vH
git rev-list --objects --all | findstr /R "hero-video\.mp4 hero-opt\.mp4 package-lock\.json Diagrama-Secuencia\.svg Diagrama-de-Entidad-Relacion\.svg"
```

Checklist before anyone touches history:

- [ ] Confirm the purge candidate set is exactly: `public/assets/hero-video.mp4`, `public/assets/hero-opt.mp4`, `package-lock.json`, `diagramas/Diagrama-Secuencia.svg`, and `diagramas/Diagrama-de-Entidad-Relacion.svg`.
- [ ] Confirm there is an approved maintenance window for the force-push.
- [ ] Confirm all open PR owners know they must rebase or reopen after the rewrite.
- [ ] Confirm branch-protection settings can temporarily allow the coordinated force-push.

## Execution

Do **not** run this in a working clone with local changes. Use a fresh clone dedicated to the rewrite:

```bash
git clone --mirror <repo-url> jumping_park_app-history-purge.git
cd jumping_park_app-history-purge.git
python -m pip install git-filter-repo
git bundle create ../jumping_park_app-pre-history-purge.bundle --all
git filter-repo --path public/assets/hero-video.mp4 --path public/assets/hero-opt.mp4 --path package-lock.json --path diagramas/Diagrama-Secuencia.svg --path diagramas/Diagrama-de-Entidad-Relacion.svg --invert-paths
```

Execution notes:

- `git filter-repo` is destructive by design; the fresh clone is the safety boundary.
- The bundle file is the rollback artifact. Keep it outside the rewritten remote.
- Do **not** create a backup branch or tag in `origin`; that would keep the old blobs reachable and defeat the purge.

## Verification

After `git filter-repo` finishes, prove the rewrite before any push:

```bash
git rev-list --objects --all | findstr /R "hero-video\.mp4 hero-opt\.mp4 package-lock\.json Diagrama-Secuencia\.svg Diagrama-de-Entidad-Relacion\.svg"
git count-objects -vH
git fsck --full
```

Expected result:

- The `findstr` command returns no matches for any configured purge candidate path.
- `git count-objects -vH` shows a smaller `size-pack` than the precheck baseline.
- `git fsck --full` reports no repository corruption.

Only after that proof should the coordinator push the rewritten refs:

```bash
git push --force --mirror origin
```

## Rollback

If verification fails **before** the force-push, discard the rewritten clone and start again from the untouched bundle or mirror backup.

If verification fails **after** the force-push:

1. Freeze new pushes immediately.
2. Restore from the external pre-rewrite backup (`git clone --mirror` copy or `git bundle` artifact).
3. Re-run the coordination checklist before any second rewrite attempt.

Never use a backup branch/tag on `origin` as rollback. Keeping old refs on the same remote preserves the blobs you were trying to purge.

## Team coordination

Communication and sequencing matter more than the command itself.

### Required coordination steps

- [ ] Announce the maintenance window and expected force-push impact.
- [ ] Ask reviewers to pause merges until the rewrite and post-purge verification finish.
- [ ] Confirm who owns the force-push and who verifies branch protections after the push.
- [ ] After the push, instruct everyone to take a **fresh clone** instead of trying to repair old local history.

### Suggested announcement template

> We are purging historical heavyweight/stale paths from Git history to reduce clone weight and remove outdated artifacts. During the maintenance window, do not merge or push to `main`. After the coordinated `git filter-repo` force-push completes, discard old local clones/branches and take a fresh clone before resuming work.

## Next step

Run the dry-run commands above, capture the evidence in the PR/release notes, and schedule the actual rewrite outside this apply batch.
