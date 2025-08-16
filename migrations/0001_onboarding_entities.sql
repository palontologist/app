-- Migration: create onboarding related entities
-- NOTE: Adjust IF NOT EXISTS usage based on SQLite capabilities (supported)

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  current_value INTEGER DEFAULT 0,
  target_value INTEGER,
  unit TEXT,
  deadline INTEGER,
  archived INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  goal_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  alignment_category TEXT,
  completed INTEGER DEFAULT 0,
  ai_analysis TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date INTEGER NOT NULL,
  event_type TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS work_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  task_id INTEGER,
  alignment_category TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS goal_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  progress_value INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Unique index for goal titles per user (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_title_idx ON goals(user_id, lower(title));
