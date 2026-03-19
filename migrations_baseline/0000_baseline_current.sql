-- Baseline migration (current production schema)
--
-- Purpose:
-- - Bootstrap NEW databases in a single step (no long migration chains).
-- - This is NOT meant to be applied on an already-initialized DB.
--
-- Notes:
-- - Uses CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS for safety on fresh DBs.
-- - If you already have some tables but missing columns, use normal migrations instead.

CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash text NOT NULL,
  created_at numeric
);

CREATE TABLE IF NOT EXISTS alignment_history (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL,
  date text NOT NULL,
  overall_alignment_score integer NOT NULL,
  completed_tasks_count integer DEFAULT 0,
  total_tasks_count integer DEFAULT 0,
  high_alignment_tasks integer DEFAULT 0,
  distraction_tasks integer DEFAULT 0,
  completed_goals_count integer DEFAULT 0,
  total_goals_count integer DEFAULT 0,
  ai_insights_summary text,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS coach_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  session_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_coach_conv_user ON coach_conversations(user_id, created_at);

CREATE TABLE IF NOT EXISTS cofounders (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  workspace_id integer NOT NULL,
  user_id text,
  email text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'member',
  status text DEFAULT 'invited',
  invitation_id text,
  invited_by text NOT NULL,
  joined_at integer,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_insights (
  user_id text PRIMARY KEY NOT NULL,
  content text,
  updated_at integer DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS events (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL,
  event_date integer NOT NULL,
  event_time text,
  event_type text,
  description text,
  metadata text,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  source text DEFAULT 'local',
  google_event_id text,
  google_calendar_id text,
  completed integer DEFAULT 0,
  completed_at integer
);

CREATE INDEX IF NOT EXISTS idx_events_source_user ON events(source, user_id);
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);

CREATE TABLE IF NOT EXISTS goal_activities (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  goal_id integer NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL,
  progress_value integer DEFAULT 0,
  completed integer DEFAULT false,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  completed_at integer,
  visibility text DEFAULT 'followers',
  completed_geohash5 text
);

CREATE TABLE IF NOT EXISTS goals (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  current_value integer DEFAULT 0,
  target_value integer,
  unit text,
  deadline integer,
  archived integer DEFAULT false,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  goal_type text,
  workspace_type text DEFAULT 'personal',
  organization_id text,
  alignment_score integer,
  alignment_category text,
  mission_pillar text,
  impact_statement text,
  ai_suggestions text
);

CREATE TABLE IF NOT EXISTS google_accounts (
  user_id text PRIMARY KEY NOT NULL,
  google_user_id text NOT NULL,
  email text,
  access_token text,
  refresh_token text NOT NULL,
  expiry_date integer,
  scope text,
  token_type text,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS google_accounts_google_user_id_unique ON google_accounts (google_user_id);

CREATE TABLE IF NOT EXISTS opportunities (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  geohash5 text,
  active integer DEFAULT true,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunity_unlock_rules (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  opportunity_id integer NOT NULL,
  metric text NOT NULL,
  threshold integer NOT NULL,
  window_days integer,
  goal_category text,
  activity_title text,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL,
  goal_id integer,
  title text NOT NULL,
  description text,
  alignment_score integer,
  alignment_category text,
  completed integer DEFAULT false,
  completed_at integer,
  ai_analysis text,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  workspace_type text DEFAULT 'personal',
  organization_id text,
  estimated_value_cents INTEGER DEFAULT 0,
  value_category TEXT
);

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id text NOT NULL,
  following_id text NOT NULL,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_follows_follower_following_unique
  ON user_follows (follower_id, following_id);

CREATE TABLE IF NOT EXISTS user_opportunity_unlocks (
  user_id text NOT NULL,
  opportunity_id integer NOT NULL,
  unlocked_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_opportunity_unlocks_user_opportunity_unique
  ON user_opportunity_unlocks (user_id, opportunity_id);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id text PRIMARY KEY NOT NULL,
  name text,
  mission text,
  world_vision text,
  focus_areas text,
  onboarded integer DEFAULT false,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  current_workspace_type text DEFAULT 'personal',
  default_organization_id text,
  handle text,
  bio text,
  discoverable integer DEFAULT true,
  location_sharing_enabled integer DEFAULT false,
  location_geohash5 text,
  location_updated_at integer
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_handle_unique ON user_profiles(handle);

CREATE TABLE IF NOT EXISTS value_settings (
  user_id TEXT PRIMARY KEY,
  design_rate_cents INTEGER DEFAULT 20000,
  content_rate_cents INTEGER DEFAULT 18000,
  sales_rate_cents INTEGER DEFAULT 12000,
  strategic_rate_cents INTEGER DEFAULT 13600,
  other_rate_cents INTEGER DEFAULT 10000,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS work_sessions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL,
  task_id integer,
  alignment_category text,
  duration_minutes integer DEFAULT 0 NOT NULL,
  started_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  organization_id text NOT NULL,
  name text NOT NULL,
  description text,
  mission text,
  created_by text NOT NULL,
  created_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
  updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS workspaces_organization_id_unique ON workspaces(organization_id);

