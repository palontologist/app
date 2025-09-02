-- Add goal_type column to goals to differentiate Personal vs Startup goals
ALTER TABLE goals ADD COLUMN goal_type TEXT;

-- Optionally backfill existing rows to 'personal' if desired (left null for now)
-- UPDATE goals SET goal_type = 'personal' WHERE goal_type IS NULL;


