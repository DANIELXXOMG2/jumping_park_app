# Admin cost smoke checklist

The goal of this checklist is to prove the admin really stays on the cheaper plane: cursors and aggregates, not growing scans.

## Preconditions

- `CURSOR_PAGINATION_ENABLED=true` for the cursor-first smoke.
- `ADMIN_AGGREGATES_ENABLED=true` for the aggregate-first smoke.
- A dataset large enough to navigate more than one page.

## Users / Consents / Minors

### Cursor contract

- Open the first page with `limit=20` or `limit=50`.
- Confirm `pageInfo.hasNextPage` and `pageInfo.nextCursor` when more data exists.
- Use `nextCursor` to request the next page.
- Confirm consent lists do not expose signed URLs; they should expose `signatureStatus` only.

### Search fallback

- Run a search by free text or identifier.
- Confirm `meta.source = search`.
- Confirm the fallback still works even when cursor pagination is enabled.

## Dashboard / stats

- Call `/api/admin/stats` and `/api/admin/stats/detailed?period=month`.
- Confirm `freshness.computedAt` is present.
- Confirm the source is aggregated when the flag is enabled.
- If `recompute=true` is used, verify the refresh does not break the response contract.

## Cost heuristic

We are not measuring real billing in CI, but we can still detect the right signals:

- Admin page: 20-50 items per request, no more.
- Dashboard: 1-5 aggregate documents, not full scans.
- No per-row signed URL enrichment.
- Searches remain bounded by tokens/cursors, not full list scans except for the controlled fallback.

If a query needs a new or different index, do not enable the flag yet: update the IaC first, then validate again against emulator/query logs.

## Minimum output

- Validated endpoint.
- Active flags.
- Cursor received and reused.
- `freshness` observed.
- Conclusion: `PASS`, `PASS WITH NOTES`, or `FAIL`.
