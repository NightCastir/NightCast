-- NightCast Club foundation migration.
-- Target database: the existing NightCast API D1 binding (NightCastBinding -> nightcast-db).
-- This migration deliberately references the existing integer users.id; it does not create auth tables.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS club_profiles (
  user_id INTEGER PRIMARY KEY,
  display_name TEXT,
  leaderboard_opt_out INTEGER NOT NULL DEFAULT 0 CHECK (leaderboard_opt_out IN (0,1)),
  notifications_enabled INTEGER NOT NULL DEFAULT 0 CHECK (notifications_enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_point_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  delta INTEGER NOT NULL CHECK (delta <> 0),
  source_type TEXT NOT NULL,
  source_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','reversed')),
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL DEFAULT 'system',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_points_user_created ON club_point_ledger(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_club_points_source ON club_point_ledger(source_type, source_id);

CREATE TABLE IF NOT EXISTS club_experience_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  delta INTEGER NOT NULL CHECK (delta <> 0),
  source_type TEXT NOT NULL,
  source_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','reversed')),
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL DEFAULT 'system',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_xp_user_created ON club_experience_ledger(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_club_xp_source ON club_experience_ledger(source_type, source_id);

CREATE TABLE IF NOT EXISTS club_activity_events (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  podcast_id INTEGER,
  session_key_hash TEXT,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_seconds >= 0),
  accepted_seconds INTEGER NOT NULL DEFAULT 0 CHECK (accepted_seconds >= 0),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','accepted','rejected','review')),
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (podcast_id) REFERENCES podcasts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_club_activity_user_created ON club_activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_activity_user_type_created ON club_activity_events(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_activity_podcast ON club_activity_events(podcast_id, created_at DESC);

CREATE TABLE IF NOT EXISTS club_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS club_levels (
  level INTEGER PRIMARY KEY CHECK (level > 0),
  slug TEXT NOT NULL UNIQUE,
  title_fa TEXT NOT NULL,
  description_fa TEXT NOT NULL DEFAULT '',
  min_xp INTEGER NOT NULL UNIQUE CHECK (min_xp >= 0),
  badge_icon TEXT,
  reward_points INTEGER NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1))
);

CREATE TABLE IF NOT EXISTS club_missions (
  id TEXT PRIMARY KEY,
  title_fa TEXT NOT NULL,
  description_fa TEXT NOT NULL DEFAULT '',
  cadence TEXT NOT NULL CHECK (cadence IN ('daily','weekly','event','once')),
  event_type TEXT NOT NULL,
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  reward_points INTEGER NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
  reward_xp INTEGER NOT NULL DEFAULT 0 CHECK (reward_xp >= 0),
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  rules_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL DEFAULT 'system',
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_club_missions_active_window ON club_missions(is_active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS club_user_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mission_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  progress_value INTEGER NOT NULL DEFAULT 0 CHECK (progress_value >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','claimed','expired')),
  completed_at TEXT,
  claimed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, mission_id, period_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES club_missions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_user_missions_user_status ON club_user_missions(user_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS club_badges (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_fa TEXT NOT NULL,
  description_fa TEXT NOT NULL DEFAULT '',
  icon_path TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  criteria_json TEXT NOT NULL DEFAULT '{}',
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_type TEXT NOT NULL DEFAULT 'system',
  source_id TEXT,
  UNIQUE (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES club_badges(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_club_user_badges_user_earned ON club_user_badges(user_id, earned_at DESC);

CREATE TABLE IF NOT EXISTS club_rewards (
  id TEXT PRIMARY KEY,
  title_fa TEXT NOT NULL,
  description_fa TEXT NOT NULL DEFAULT '',
  reward_type TEXT NOT NULL,
  cost_points INTEGER NOT NULL CHECK (cost_points >= 0),
  stock_remaining INTEGER CHECK (stock_remaining IS NULL OR stock_remaining >= 0),
  max_per_user INTEGER CHECK (max_per_user IS NULL OR max_per_user > 0),
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  delivery_config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL DEFAULT 'system',
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_club_rewards_active_window ON club_rewards(is_active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS club_reward_redemptions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  reward_id TEXT NOT NULL,
  cost_points INTEGER NOT NULL CHECK (cost_points >= 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','cancelled','failed')),
  delivery_reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES club_rewards(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_club_redemptions_user_created ON club_reward_redemptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_redemptions_reward_status ON club_reward_redemptions(reward_id, status);

CREATE TABLE IF NOT EXISTS club_audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id INTEGER,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  request_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_club_audit_created ON club_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_audit_target ON club_audit_logs(target_type, target_id, created_at DESC);

-- Conservative initial configuration: earning and rewards stay disabled until server routes and
-- anti-abuse checks are deployed and verified. This avoids awarding points from a UI-only feature.
INSERT OR IGNORE INTO club_settings(setting_key, setting_value) VALUES
  ('club_enabled', 'false'),
  ('earning_enabled', 'false'),
  ('rewards_enabled', 'false'),
  ('daily_points_cap', '100'),
  ('daily_xp_cap', '250'),
  ('listen_min_session_seconds', '30'),
  ('listen_max_credit_seconds_per_event', '60'),
  ('rules_version', '1');

INSERT OR IGNORE INTO club_levels(level, slug, title_fa, description_fa, min_xp, badge_icon, reward_points, is_active) VALUES
  (1, 'new-listener', 'شنونده تازه‌وارد', 'آغاز سفر در جهان شنیداری NightCast', 0, '/assets/icons/icon-512.png', 0, 1),
  (2, 'sound-wanderer', 'رهرو صدا', 'قدم‌های نخست در مسیر کشف صداها', 150, '/assets/icons/icon-512.png', 0, 1),
  (3, 'moon-explorer', 'کاوشگر ماه', 'کشف روایت‌ها و جهان‌های تازه', 400, '/assets/icons/icon-512.png', 0, 1),
  (4, 'galaxy-traveler', 'مسافر کهکشان', 'سفر پیوسته میان موضوعات فرهنگی', 900, '/assets/icons/icon-512.png', 0, 1),
  (5, 'sound-guardian', 'نگهبان صدا', 'همراهی مستمر با محتوای شنیداری', 1800, '/assets/icons/icon-512.png', 0, 1),
  (6, 'night-star', 'ستاره شب', 'حضور درخشان در جامعه شنوندگان', 3500, '/assets/icons/icon-512.png', 0, 1),
  (7, 'nightcast-legend', 'افسانه NightCast', 'قله سفر شنیداری و فرهنگی', 7000, '/assets/icons/icon-512.png', 0, 1);
