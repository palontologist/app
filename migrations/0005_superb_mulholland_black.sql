CREATE TABLE `alignment_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`overall_alignment_score` integer NOT NULL,
	`completed_tasks_count` integer DEFAULT 0,
	`total_tasks_count` integer DEFAULT 0,
	`high_alignment_tasks` integer DEFAULT 0,
	`distraction_tasks` integer DEFAULT 0,
	`completed_goals_count` integer DEFAULT 0,
	`total_goals_count` integer DEFAULT 0,
	`ai_insights_summary` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `google_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`google_user_id` text NOT NULL,
	`email` text,
	`access_token` text,
	`refresh_token` text NOT NULL,
	`expiry_date` integer,
	`scope` text,
	`token_type` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `google_accounts_google_user_id_unique` ON `google_accounts` (`google_user_id`);--> statement-breakpoint
ALTER TABLE `events` ADD `sync_source` text DEFAULT 'manual';