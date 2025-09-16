ALTER TABLE `events` ADD `google_event_id` text;--> statement-breakpoint
ALTER TABLE `events` ADD `google_calendar_id` text;--> statement-breakpoint
ALTER TABLE `events` ADD `last_synced_at` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `google_event_id` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `google_calendar_id` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `last_synced_at` integer;