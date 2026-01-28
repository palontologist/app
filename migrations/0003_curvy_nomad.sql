CREATE TABLE `cofounders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'member',
	`status` text DEFAULT 'invited',
	`invitation_id` text,
	`invited_by` text NOT NULL,
	`joined_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`mission` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_organization_id_unique` ON `workspaces` (`organization_id`);--> statement-breakpoint
ALTER TABLE `goals` ADD `workspace_type` text DEFAULT 'personal';--> statement-breakpoint
ALTER TABLE `goals` ADD `organization_id` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `workspace_type` text DEFAULT 'personal';--> statement-breakpoint
ALTER TABLE `tasks` ADD `organization_id` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `current_workspace_type` text DEFAULT 'personal';--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `default_organization_id` text;