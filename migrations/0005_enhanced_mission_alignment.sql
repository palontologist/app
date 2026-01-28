-- Enhanced Mission Alignment System
-- Add mission pillars, impact statements, and historical tracking

-- Add mission pillars to user profiles
ALTER TABLE user_profiles ADD COLUMN mission_pillars TEXT; -- JSON array of mission pillars

-- Add impact fields to tasks
ALTER TABLE tasks ADD COLUMN mission_pillar TEXT; -- Which mission pillar this task serves
ALTER TABLE tasks ADD COLUMN impact_statement TEXT; -- User's impact statement
ALTER TABLE tasks ADD COLUMN ai_suggestions TEXT; -- AI suggestions for improvement
ALTER TABLE tasks ADD COLUMN weekly_reflection_notes TEXT; -- Weekly reflection notes

-- Add impact fields to goals
ALTER TABLE goals ADD COLUMN mission_pillar TEXT; -- Which mission pillar this goal serves
ALTER TABLE goals ADD COLUMN impact_statement TEXT; -- User's impact statement
ALTER TABLE goals ADD COLUMN ai_suggestions TEXT; -- AI suggestions for improvement
ALTER TABLE goals ADD COLUMN alignment_score INTEGER; -- Goal alignment score (0-100)
ALTER TABLE goals ADD COLUMN alignment_category TEXT; -- high|medium|low|distraction

-- Add historical alignment tracking table
CREATE TABLE IF NOT EXISTS alignment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  overall_alignment_score INTEGER NOT NULL, -- 0-100
  completed_tasks_count INTEGER DEFAULT 0,
  total_tasks_count INTEGER DEFAULT 0,
  high_alignment_tasks INTEGER DEFAULT 0,
  distraction_tasks INTEGER DEFAULT 0,
  completed_goals_count INTEGER DEFAULT 0,
  total_goals_count INTEGER DEFAULT 0,
  ai_insights_summary TEXT,
  created_at INTEGER DEFAULT (unixepoch() * 1000),
  UNIQUE(user_id, date)
);

-- Add weekly reflection table
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  week_start_date TEXT NOT NULL, -- YYYY-MM-DD (Monday of the week)
  key_wins TEXT, -- JSON array of key wins
  main_challenges TEXT, -- JSON array of challenges
  alignment_highlights TEXT, -- What went well with mission alignment
  improvement_areas TEXT, -- Areas to improve
  next_week_focus TEXT, -- Main focus for next week
  ai_summary TEXT, -- AI-generated summary
  created_at INTEGER DEFAULT (unixepoch() * 1000),
  updated_at INTEGER DEFAULT (unixepoch() * 1000),
  UNIQUE(user_id, week_start_date)
);

-- Add mission alignment report cache
CREATE TABLE IF NOT EXISTS mission_alignment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  report_date TEXT NOT NULL, -- YYYY-MM-DD
  report_type TEXT NOT NULL, -- daily|weekly|monthly
  report_data TEXT, -- JSON data
  created_at INTEGER DEFAULT (unixepoch() * 1000),
  UNIQUE(user_id, report_date, report_type)
);