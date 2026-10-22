-- NightCast Club daily engagement, quiz, referrals, and notifications.
-- Apply after 0003_atomic_reward_redemption.sql on nightcast-db.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS club_daily_visits (
  user_id INTEGER NOT NULL,
  visit_day TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, visit_day),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  shown_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TEXT,
  selected_index INTEGER CHECK (selected_index IS NULL OR selected_index BETWEEN 0 AND 3),
  correct INTEGER CHECK (correct IS NULL OR correct IN (0,1)),
  reward_points INTEGER NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
  UNIQUE (user_id, day_key),
  UNIQUE (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_quiz_user_shown ON club_quiz_sessions(user_id, shown_at DESC);

CREATE TABLE IF NOT EXISTS club_referral_codes (
  user_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS club_referrals (
  id TEXT PRIMARY KEY,
  inviter_user_id INTEGER NOT NULL,
  invited_user_id INTEGER NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 20 CHECK (reward_points >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (inviter_user_id <> invited_user_id),
  FOREIGN KEY (inviter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_referrals_inviter ON club_referrals(inviter_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS club_notifications (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  dedupe_key TEXT NOT NULL UNIQUE,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_notifications_user_created ON club_notifications(user_id, created_at DESC);

ALTER TABLE club_profiles ADD COLUMN timezone TEXT;

CREATE TABLE IF NOT EXISTS club_notification_dispatch_log (
  user_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,
  day_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notification_type, day_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  endpoint_hash TEXT NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  subscription_json TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO club_settings(setting_key, setting_value) VALUES
  ('daily_visit_reward_points','2'),
  ('daily_quiz_reward_points','5'),
  ('referral_reward_points','20'),
  ('daily_quiz_enabled','true'),
  ('push_last_podcast_id','0');
