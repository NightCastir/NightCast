-- Isolated local D1 fixture only. Never apply to the production database.
PRAGMA foreign_keys = ON;
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user'
);
CREATE TABLE admins (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT ''
);
CREATE TABLE user_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE admin_sessions (
  id INTEGER PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
CREATE TABLE podcasts (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'published',
  publish_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users(id,username,full_name,role) VALUES (101,'club-fixture-user','Club Test Listener','user'), (102,'club-fixture-invitee','Club Test Invitee','user');
INSERT INTO admins(id,username,full_name) VALUES (1,'club-fixture-admin','Club Test Admin');
INSERT INTO user_sessions(id,user_id,session_token,expires_at) VALUES (1,101,'club-test-user-token','2099-01-01 00:00:00'), (2,102,'club-test-invitee-token','2099-01-01 00:00:00');
INSERT INTO admin_sessions(id,admin_id,session_token,expires_at) VALUES (1,1,'club-test-admin-token','2099-01-01 00:00:00');
INSERT INTO podcasts(id,title,slug) VALUES (501,'Club Integration Fixture','club-integration-fixture');
