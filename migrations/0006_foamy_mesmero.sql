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
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` integer,
	`name` text NOT NULL,
	`email` text,
	`hourly_rate` integer,
	`target_hourly_rate` integer,
	`retainer_amount` integer,
	`payment_status` text DEFAULT 'active',
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `equity_bets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` integer,
	`company_name` text NOT NULL,
	`equity_percentage` integer,
	`estimated_valuation` integer,
	`status` text DEFAULT 'active',
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
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
CREATE TABLE `invoice_line_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`client_id` integer,
	`invoice_id` text,
	`description` text NOT NULL,
	`duration_minutes` integer,
	`rate` integer,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'draft',
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`url` text,
	`geohash5` text,
	`active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `opportunity_unlock_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` integer NOT NULL,
	`metric` text NOT NULL,
	`threshold` integer NOT NULL,
	`window_days` integer,
	`goal_category` text,
	`activity_title` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`client_id` integer,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'USD',
	`payment_date` integer NOT NULL,
	`payment_method` text,
	`invoice_id` text,
	`description` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `revenue_impact` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`client_id` integer,
	`date` text NOT NULL,
	`mrr` integer,
	`arr` integer,
	`total_revenue` integer,
	`hours_tracked` integer,
	`effective_hourly_rate` integer,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`event_id` integer,
	`client_id` integer,
	`project_tag` text,
	`activity_type` text,
	`duration_minutes` integer NOT NULL,
	`billable` integer DEFAULT true,
	`invoiced` integer DEFAULT false,
	`entry_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_follows_follower_following_unique` ON `user_follows` (`follower_id`,`following_id`);--> statement-breakpoint
CREATE TABLE `user_opportunity_unlocks` (
	`user_id` text NOT NULL,
	`opportunity_id` integer NOT NULL,
	`unlocked_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_opportunity_unlocks_user_opportunity_unique` ON `user_opportunity_unlocks` (`user_id`,`opportunity_id`);--> statement-breakpoint
CREATE TABLE `value_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`design_rate_cents` integer DEFAULT 20000,
	`content_rate_cents` integer DEFAULT 18000,
	`sales_rate_cents` integer DEFAULT 12000,
	`strategic_rate_cents` integer DEFAULT 13600,
	`other_rate_cents` integer DEFAULT 10000,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `events` ADD `source` text DEFAULT 'local';--> statement-breakpoint
ALTER TABLE `events` ADD `google_event_id` text;--> statement-breakpoint
ALTER TABLE `events` ADD `google_calendar_id` text;--> statement-breakpoint
ALTER TABLE `events` ADD `completed` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `events` ADD `completed_at` integer;--> statement-breakpoint
ALTER TABLE `goal_activities` ADD `completed_at` integer;--> statement-breakpoint
ALTER TABLE `goal_activities` ADD `visibility` text DEFAULT 'followers';--> statement-breakpoint
ALTER TABLE `goal_activities` ADD `completed_geohash5` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `alignment_score` integer;--> statement-breakpoint
ALTER TABLE `goals` ADD `alignment_category` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `mission_pillar` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `impact_statement` text;--> statement-breakpoint
ALTER TABLE `goals` ADD `ai_suggestions` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `estimated_value_cents` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `tasks` ADD `value_category` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `handle` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `discoverable` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `location_sharing_enabled` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `location_geohash5` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `location_updated_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_handle_unique` ON `user_profiles` (`handle`);