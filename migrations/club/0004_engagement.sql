-- NightCast Club engagement: idempotent daily rewards, one-shot quiz, referrals, push subscriptions and share audit.
-- Questions and correct answers remain versioned in GitHub JSON; DB stores only question exposure and immutable answer choice.
CREATE TABLE IF NOT EXISTS club_daily_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_day TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK(points_awarded >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, checkin_day)
);
CREATE TABLE IF NOT EXISTS club_quiz_impressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  shown_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  shown_day TEXT NOT NULL,
  UNIQUE(user_id, question_id),
  UNIQUE(user_id, shown_day)
);
CREATE TABLE IF NOT EXISTS club_quiz_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option INTEGER NOT NULL CHECK(selected_option BETWEEN 0 AND 3),
  is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK(points_awarded >= 0),
  answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id),
  FOREIGN KEY(user_id, question_id) REFERENCES club_quiz_impressions(user_id, question_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS club_invite_codes (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  code_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS club_referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  invite_code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','qualified','rejected')),
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK(points_awarded >= 0),
  qualified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(inviter_user_id <> invitee_user_id)
);
CREATE INDEX IF NOT EXISTS idx_club_referrals_inviter ON club_referrals(inviter_user_id, status);
CREATE TABLE IF NOT EXISTS club_share_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  podcast_id INTEGER REFERENCES podcasts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK(channel IN ('native','sms','whatsapp','telegram','soroush','copy','other')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS club_push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint_hash TEXT NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  subscription_json TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web' CHECK(platform IN ('web','android','ios')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS club_notification_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('new_podcast','daily_quiz','club_reward','referral')),
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TEXT,
  read_at TEXT,
  UNIQUE(user_id, notification_key)
);
CREATE INDEX IF NOT EXISTS idx_club_quiz_impressions_recent ON club_quiz_impressions(user_id, shown_at);
CREATE INDEX IF NOT EXISTS idx_club_checkins_day ON club_daily_checkins(checkin_day, user_id);
CREATE INDEX IF NOT EXISTS idx_club_notifications_user ON club_notification_events(user_id, created_at DESC);
