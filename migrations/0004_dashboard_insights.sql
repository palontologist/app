-- Cache table for dashboard AI insights per user
CREATE TABLE IF NOT EXISTS dashboard_insights (
  user_id TEXT PRIMARY KEY,
  content TEXT,
  updated_at INTEGER DEFAULT (unixepoch() * 1000)
);


