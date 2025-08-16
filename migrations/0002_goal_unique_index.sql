-- Add unique index to prevent duplicate goal titles per user (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_title_idx ON goals(user_id, lower(title));
