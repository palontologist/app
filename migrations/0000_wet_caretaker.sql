CREATE TABLE IF NOT EXISTS `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text,
	`mission` text,
	`world_vision` text,
	`focus_areas` text,
	`onboarded` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
