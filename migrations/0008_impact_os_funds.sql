-- Enterprise Impact OS: Funds and Portfolio Management
-- Migration 0008

-- Funds table: Enterprise fund accounts
CREATE TABLE IF NOT EXISTS `funds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`thesis` text,
	`sdg_targets` text,
	`plan` text DEFAULT 'studio',
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `funds_organization_id_unique` ON `funds` (`organization_id`);

-- Portfolio companies: Companies in fund portfolio
CREATE TABLE IF NOT EXISTS `portfolio_companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fund_id` integer NOT NULL,
	`name` text NOT NULL,
	`sector` text,
	`sdg_alignment` integer DEFAULT 0,
	`website` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

-- Portfolio activities: Activity log per company
CREATE TABLE IF NOT EXISTS `portfolio_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`date` text NOT NULL,
	`activity_type` text NOT NULL,
	`hours` integer NOT NULL,
	`sdg_category` text,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

-- Add fund_id to workspaces for multi-fund support
ALTER TABLE `workspaces` ADD COLUMN `fund_id` integer;