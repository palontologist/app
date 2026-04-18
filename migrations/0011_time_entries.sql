-- Time entries table
CREATE TABLE IF NOT EXISTS `time_entries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `event_id` integer,
  `client_id` integer,
  `project_tag` text,
  `activity_type` text,
  `duration_minutes` integer NOT NULL,
  `billable` integer DEFAULT 1,
  `invoiced` integer DEFAULT 0,
  `entry_date` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);