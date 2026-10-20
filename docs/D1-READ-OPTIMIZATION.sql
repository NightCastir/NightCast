-- NightCast production D1 read-optimization indexes
-- Applied to database: nightcast-db
-- Database ID: 21cb51d1-8484-4f3e-90b6-ada3228506d6
-- These additive indexes reduce table scans for the public catalogue, podcast stats,
-- and comments endpoints. Safe to re-run because every index uses IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_podcasts_status_id
  ON podcasts(status, id DESC);

CREATE INDEX IF NOT EXISTS idx_podcast_comments_podcast_status_created
  ON podcast_comments(podcast_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_favorites_podcast_id
  ON user_favorites(podcast_id);
