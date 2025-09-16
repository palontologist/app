CREATE TABLE `dashboard_insights` (
	`user_id` text PRIMARY KEY NOT NULL,
	`content` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000)
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
ALTER TABLE `goals` ADD `goal_type` text;