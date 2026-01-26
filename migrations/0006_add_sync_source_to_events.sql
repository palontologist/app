-- Add sync_source column to events table for Google Calendar integration
ALTER TABLE `events` ADD `sync_source` text DEFAULT 'manual';
