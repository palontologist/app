CREATE TABLE `dashboard_insights` (
	`user_id` text PRIMARY KEY NOT NULL,
	`content` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
ALTER TABLE `goals` ADD `goal_type` text;