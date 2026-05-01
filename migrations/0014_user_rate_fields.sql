-- Add target rate and time tracking fields to user profiles
ALTER TABLE user_profiles ADD COLUMN target_hourly_rate INTEGER;
ALTER TABLE user_profiles ADD COLUMN meeting_hours_per_month INTEGER DEFAULT 10;
ALTER TABLE user_profiles ADD COLUMN email_hours_per_month INTEGER DEFAULT 5;