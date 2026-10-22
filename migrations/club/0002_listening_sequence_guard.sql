-- Listening-event sequencing hardening for NightCast Club.
-- Apply after 0001_club_foundation.sql. Safe to run only once per database migration ledger.
-- This adds replay/double-submit protection primitives; the API must still validate elapsed time
-- using server receipt timestamps and must never trust client-reported listening duration.
ALTER TABLE club_activity_events ADD COLUMN sequence_number INTEGER;
ALTER TABLE club_activity_events ADD COLUMN received_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_club_activity_session_sequence
  ON club_activity_events(user_id, session_key_hash, sequence_number)
  WHERE session_key_hash IS NOT NULL AND sequence_number IS NOT NULL AND sequence_number > 0;

CREATE INDEX IF NOT EXISTS idx_club_activity_session_received
  ON club_activity_events(user_id, session_key_hash, received_at)
  WHERE session_key_hash IS NOT NULL;
