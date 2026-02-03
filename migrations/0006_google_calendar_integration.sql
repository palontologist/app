-- Google Calendar Integration
-- Add fields to events table to track Google Calendar events

ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'local'; -- 'local' | 'google'
ALTER TABLE events ADD COLUMN google_event_id TEXT; -- Google Calendar event ID
ALTER TABLE events ADD COLUMN google_calendar_id TEXT; -- Which Google Calendar it came from

-- Create index for efficient Google event lookups
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_events_source_user ON events(source, user_id);
