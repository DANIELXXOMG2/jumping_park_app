# Offline replay drill

This drill tests the kiosk's most delicate promise: accept a consent without network access, then replay it without duplicating the sequence or creating two consents.

## Preconditions

- `OFFLINE_QUEUE_ENABLED=true`
- `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=true`
- App restarted or redeployed.
- Environment with Firestore access so you can inspect `consents` and `offline_sync`.

Do not run this drill in production with the default flags disabled; enable it in a controlled preview or staging environment first.

## Test flow

1. Open the kiosk and complete the flow until the consent screen.
2. Cut browser or device connectivity.
3. Sign and submit the consent.
4. Confirm the UI reports deferred success and does not crash.
5. Restore connectivity.
6. Wait for the automatic replay, or trigger a manual retry if the operator needs it.

## Expected verification

- Exactly one final consent exists in `consents`.
- `offline_sync/{dedupeKey}` exists for that operation.
- Retrying the same payload does not create a second consent.
- The reserved sequence matches the final acknowledgment.
- The queue item moves from `pending/failed` to a resolved state.

## Data to capture

- `dedupeKey`
- Local signing timestamp (`signedAtLocal`)
- Final consent ID.
- Final sequence.
- Operator-visible message.

## Common failures

| Symptom | Technical reading | Action |
| --- | --- | --- |
| the item stays in `failed` | network error or invalid payload | inspect `lastError`, then retry with stable connectivity |
| two consents appear | idempotency failure | disable `OFFLINE_QUEUE_ENABLED` and `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`, then open an incident |
| `offline_sync` does not exist | the replay never reached the ledger | inspect `/api/consentimientos` and `consentService` |

## Drill output

Record the result as `PASS` or `FAIL` together with:

- environment
- operator
- dedupeKey
- `consents` evidence
- `offline_sync` evidence
