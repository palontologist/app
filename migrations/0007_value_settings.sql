-- Add Greta value estimation columns to tasks
ALTER TABLE tasks ADD COLUMN estimated_value_cents INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN value_category TEXT;

-- Create value settings table (per-user, per-category rates)
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
