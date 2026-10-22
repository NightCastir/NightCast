# NightCast Club — implementation checkpoint

## Scope of this checkpoint

This branch establishes the first versioned schema and a theme-aware dashboard shell. It does **not** claim the club is live. The production API currently has no verified `/api/v1/club/summary` route, so the client deliberately displays an unavailable state instead of inventing points, XP, missions, badges, or ledger entries.

## Evidence-based architecture decision

- The currently deployed `nightcast-api` Worker has a D1 binding named `NightCastBinding` that points to the existing `nightcast-db` database. A source snapshot of the deployed Worker was added at `workers/nightcast-api.js` on this feature branch after scanning it for common inline-secret patterns; the source is now reviewable, but this snapshot is not yet a tested deployment pipeline.
- That database contains the existing integer-keyed `users` table, `user_sessions`, `admin_sessions`, `podcasts`, `podcast_comments`, `user_favorites`, and `book_summary_requests` tables.
- The API's `checkAuth()` resolves a Bearer token against `admin_sessions` and then `user_sessions`; the user result includes the existing `users.id`, `username`, `full_name`, and `role`.
- Google sign-in is handled by the existing `/api/v1/public/openid/google` route. It validates the Google ID token through Google's tokeninfo endpoint, checks verified email and the configured audience, finds or creates the existing user record, and writes a row to `user_sessions`.
- A second D1 database named `nightcastdb` uses a separate text-ID users/sessions/roles schema. It is not bound to the deployed `nightcast-api` Worker settings. The club must **not** silently switch identities or create parallel auth tables; this migration targets the existing API database and its integer user IDs.
- `nightcast-shield` acts as the public API front layer and forwards requests to `nightcast-api`.
- The existing theme system defines eight theme IDs: `midnight-cosmos`, `moonlight`, `aurora`, `studio-noir`, `deep-ocean`, `royal-gold`, `neon-city`, and `persian-heritage`. The club stylesheet consumes `--nc-theme-*` tokens and loads the existing Moonlight contrast stylesheet last.

## Files introduced in this checkpoint

- `migrations/club/0001_club_foundation.sql`: versioned schema for point and XP ledgers, listening events, settings, levels, missions, user mission periods, badges, rewards/redemptions, profiles, and audit logs. Unique idempotency keys are defined on ledgers and redemptions. No auth table is created.
- `migrations/club/0002_listening_sequence_guard.sql`: adds per-event sequence numbers and server receipt timestamps, with a partial unique index to reject repeated positive sequence numbers for the same user/session.
- `migrations/club/0003_atomic_reward_redemption.sql`: validates feature flags, reward availability, stock, per-user limits, and balance inside SQLite triggers; the redemption, stock decrement, debit ledger, and audit record are one atomic statement.
- `workers/club-api.js`: API module for summary, ledgers, missions, badges, rewards, listening events, reward redemption, and admin creation of inactive missions/rewards. It receives the existing Worker `checkAuth()` resolver; it does not create a parallel login/session system.
- `workers/nightcast-api.js`: restored as a complete tracked source snapshot from the current Cloudflare Worker and wired to the club module before legacy route dispatch. The import is bundled by Wrangler; this repository source is not yet deployed to Production.
- `wrangler.toml`: records the existing Worker name, compatibility date, and D1 binding for reproducible bundling/deployment. Secrets remain managed in Cloudflare; no automatic production deployment is configured.
- `club.html`, `css/nightcast-club.css`, `js/nightcast-club.js`: Persian RTL dashboard shell with responsive layout and theme-token styling.
- `_redirects` and `index.html`: canonical `/club` route and a primary-navigation entry.
- `tests/club-schema-acceptance.cjs`, `tests/club-api-acceptance.cjs`, and `.github/workflows/club-foundation-acceptance.yml`: schema/theme checks, route authorization tests, replay checks, atomic redemption tests, and a Wrangler dry-run bundle check.

## Isolated D1 validation completed

- Applied `0001` statement-by-statement to the separate D1 database named `test`, after creating minimal fixture `users` and `podcasts` tables; no Production database was modified. Then applied `0002` to that same isolated test database and verified the new columns and partial unique index exist.
- Confirmed all 13 `club_*` tables exist, seven levels are seeded, and `club_enabled` / `earning_enabled` remain `false`.
- Confirmed the unique idempotency constraint rejects a duplicate `club_point_ledger.idempotency_key` (D1 returned a UNIQUE constraint error on the second insert).
- Inserted a temporary test user and listening event in D1 `test`, confirmed a second event using the same user/session/sequence was rejected with `UNIQUE constraint failed`, then removed both fixture rows and verified both fixture counts were zero.
- Applied the atomic redemption triggers from `0003` to the isolated D1 `test` database. A successful redemption reduced balance from 20 to 10, decremented stock from 3 to 2, and created one audit row. Reusing the same idempotency key was rejected without another debit/stock change; insufficient balance and disabled rewards were also rejected. All temporary users, rewards, redemptions, ledger rows and audit rows were removed; the three feature flags were reset to `false`.
- Exercised the listening-event INSERT and conditional point/XP ledger SQL against D1 `test`: the event and both ledgers inserted successfully with earning flags temporarily enabled. All fixture rows were removed and flags reset to `false` afterward.
- Removed the temporary user and ledger fixture after the check; verified the fixture user count returned to zero. The schema remains in the isolated `test` database for further integration tests.

## Production safety

The migration inserts conservative settings with `club_enabled=false`, `earning_enabled=false`, and `rewards_enabled=false`. Do not run this migration against Production as part of a blind deploy. First validate it in an isolated test database and add the corresponding migration to the repository's established deployment process.

## Remaining implementation blockers

1. The API module is wired into the tracked Worker source, but it has not been deployed to the Cloudflare Production Worker. Keep the club and earning/reward flags disabled until CI and integration tests pass.
2. Apply migrations `0001`–`0003` to an isolated D1 database with the full existing auth/user/podcast schema, then run route tests against that isolated binding. Do not apply these migrations to Production yet.
3. Extend testing to concurrent requests across different sessions, daily cap races, mission progression/claiming, and fulfillment/cancellation workflows.
4. Connect the live player to the listening-event contract. Client-reported playback cannot prove human attention; use server receipt times, sequence guards, caps, and anomaly review.
5. Run the new GitHub Actions workflow, including Wrangler dry-run bundling, and the existing NightCast acceptance workflows; inspect actual results before marking the feature ready.
6. Verify the page in all eight themes, including light Moonlight, and test older Android TV browsers.

## Status

- Implemented in branch: schema draft, dashboard shell, canonical route, navigation entry, theme-token styling, honest API-unavailable state, and acceptance test workflow.
- Isolated D1 schema smoke test: passed (13 tables; seven levels; earning disabled; duplicate idempotency key rejected; temporary fixture cleaned).
- Implemented in the branch but not yet deployed: authenticated API route module, listening event sequence validation, idempotent ledger writes, and trigger-backed atomic reward redemption. Missions/rewards are created inactive; there is no public feature-flag endpoint.
- Not yet implemented: mission progression/claim lifecycle, reward fulfillment/cancellation workflow, complete admin panel, and concurrent cap/race tests.
- Not deployed to Production by this checkpoint. Earning and rewards remain disabled by default.


## Club API lifecycle implementation

The feature branch now includes the following server-checked routes in `workers/club-api.js`:

- Member routes: `GET /api/v1/club/summary`, `ledger`, `missions`, `badges`, `rewards`; `POST /listen-events`, `/missions/:id/claim`, and `/rewards/:id/redeem`.
- Admin routes: `GET /admin/overview`; create and activate/deactivate mission/reward routes; `POST /admin/redemptions/:id/fulfill` and `/cancel`.
- The admin console is `/club-admin.html` and reads the existing `NightCastToken`; the API still enforces the admin role. New missions and rewards are created inactive.
- Accepted listen events update cadence-aware mission progress in the same D1 batch as the event and earning ledgers. Mission claims use unique point/XP idempotency keys. Cancellation refunds are idempotent and restore finite stock once; fulfillment only transitions pending requests.
- Daily XP award SQL is clamped to the remaining daily cap, and the D1 concurrency contract test attempts more requests than the points/XP caps allow while racing two redemptions for one remaining stock item.

## Dedicated workflows

Three separate workflows were added without removing or disabling existing workflows:

1. `.github/workflows/club-route-ci.yml` — schema/route acceptance, JavaScript syntax, and Wrangler dry-run bundle.
2. `.github/workflows/club-api-d1-integration.yml` — isolated local D1 base schema plus all three migrations, test-only feature flags, a local Worker, authenticated route/lifecycle integration tests, and concurrency tests.
3. `.github/workflows/club-lifecycle-admin-acceptance.yml` — mission/reward lifecycle and admin-console contract checks.

The local D1 fixture and test-only enabled flags live under `tests/fixtures/`; they must never be applied to production. The isolated integration workflow does not deploy the production Worker or mutate production D1. Production feature flags remain controlled by the production D1 settings and should remain disabled until all required CI checks are green and a separately reviewed release is approved.
