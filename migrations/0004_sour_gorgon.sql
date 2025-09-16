CREATE TABLE `markets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`region` text,
	`settlement_date_iso` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`yes_price_cents` integer DEFAULT 50 NOT NULL,
	`no_price_cents` integer DEFAULT 50 NOT NULL,
	`threshold` text,
	`unit` text,
	`source` text,
	`source_url` text,
	`outcome` text,
	`actual_value` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `market_bets` ADD `price_cents` integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `market_bets` ADD `shares_milli` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `market_bets` ADD `payout_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `market_bets` ADD `settled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `market_bets` ADD `settled_at` integer;