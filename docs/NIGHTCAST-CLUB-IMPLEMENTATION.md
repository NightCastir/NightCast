# NightCast Club — implementation checkpoint

## Scope of this checkpoint

This branch establishes the first versioned schema and a theme-aware dashboard shell. It does **not** claim the club is live. The production API currently has no verified `/api/v1/club/summary` route, so the client deliberately displays an unavailable state instead of inventing points, XP, missions, badges, or ledger entries.

## Evidence-based architecture decision

- The currently deployed `nightcast-api` Worker has a D1 binding named `NightCastBinding` that points to the existing `nightcast-db` database.
- That database contains the existing integer-keyed `users` table, `user_sessions`, `admin_sessions`, `podcasts`, `podcast_comments`, `user_favorites`, and `book_summary_requests` tables.
- The API's `checkAuth()` resolves a Bearer token against `admin_sessions` and then `user_sessions`; the user result includes the existing `users.id`, `username`, `full_name`, and `role`.
- Google sign-in is handled by the existing `/api/v1/public/openid/google` route. It validates the Google ID token through Google's tokeninfo endpoint, checks verified email and the configured audience, finds or creates the existing user record, and writes a row to `user_sessions`.
- A second D1 database named `nightcastdb` uses a separate text-ID users/sessions/roles schema. It is not bound to the deployed `nightcast-api` Worker settings. The club must **not** silently switch identities or create parallel auth tables; this migration targets the existing API database and its integer user IDs.
- `nightcast-shield` acts as the public API front layer and forwards requests to `nightcast-api`.
- The existing theme system defines eight theme IDs: `midnight-cosmos`, `moonlight`, `aurora`, `studio-noir`, `deep-ocean`, `royal-gold`, `neon-city`, and `persian-heritage`. The club stylesheet consumes `--nc-theme-*` tokens and loads the existing Moonlight contrast stylesheet last.

## Files introduced in this checkpoint

- `migrations/club/0001_club_foundation.sql`: versioned schema for point and XP ledgers, listening events, settings, levels, missions, user mission periods, badges, rewards/redemptions, profiles, and audit logs. Unique idempotency keys are defined on ledgers and redemptions. No auth table is created.
- `club.html`, `css/nightcast-club.css`, `js/nightcast-club.js`: Persian RTL dashboard shell with responsive layout and theme-token styling.
- `_redirects` and `index.html`: canonical `/club` route and a primary-navigation entry.
- `tests/club-schema-acceptance.cjs` and `.github/workflows/club-foundation-acceptance.yml`: static/schema acceptance checks and a dedicated CI workflow.

## Isolated D1 validation completed

- Applied the migration statement-by-statement to the separate D1 database named `test`, after creating minimal fixture `users` and `podcasts` tables; no Production database was modified.
- Confirmed all 13 `club_*` tables exist, seven levels are seeded, and `club_enabled` / `earning_enabled` remain `false`.
- Confirmed the unique idempotency constraint rejects a duplicate `club_point_ledger.idempotency_key` (D1 returned a UNIQUE constraint error on the second insert).
- Removed the temporary user and ledger fixture after the check; verified the fixture user count returned to zero. The schema remains in the isolated `test` database for further integration tests.

## Production safety

The migration inserts conservative settings with `club_enabled=false`, `earning_enabled=false`, and `rewards_enabled=false`. Do not run this migration against Production as part of a blind deploy. First validate it in an isolated test database and add the corresponding migration to the repository's established deployment process.

## Remaining implementation blockers

1. The deployed `nightcast-api` source is currently uploaded directly to Cloudflare and is not tracked as a matching source file in this repository. Establishing a reproducible source-of-truth and deploy path is required before safely adding authenticated API routes.
2. Add and test server routes for club summary, ledger, missions, badges, rewards, listening events, and admin management. All routes must use the existing `checkAuth()` result and server-side role checks.
3. Implement transactional/atomic earning and redemption logic. A UI click must never mint points. D1 batch/unique constraints and conditional writes must be tested under duplicate and concurrent requests.
4. Connect real player telemetry to server-validated listening sessions; client-supplied time is not proof of human attention. Apply caps and anomaly checks.
5. Expand isolated D1 testing to foreign-key behavior, atomic reward redemption, concurrent writes, and the full API integration before any Production migration.
6. Run the new GitHub Actions workflow and the existing NightCast acceptance workflows; inspect actual results before marking the feature ready.
7. Verify the complete page in all eight themes, including the light Moonlight theme, and run responsive checks including older Android TV browsers.

## Status

- Implemented in branch: schema draft, dashboard shell, canonical route, navigation entry, theme-token styling, honest API-unavailable state, and acceptance test workflow.
- Isolated D1 schema smoke test: passed (13 tables; seven levels; earning disabled; duplicate idempotency key rejected; temporary fixture cleaned).
- Not yet implemented: live club API routes, active earning, missions/rewards lifecycle, server-side level calculation, admin panel, production migration, and deployment.
- Not deployed to Production by this checkpoint.
