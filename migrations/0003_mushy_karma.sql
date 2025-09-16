CREATE TABLE `market_bets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`market_id` text NOT NULL,
	`side` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`region` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
