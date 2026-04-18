-- Clients table
CREATE TABLE IF NOT EXISTS `clients` (
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