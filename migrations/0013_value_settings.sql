-- Value settings table
CREATE TABLE IF NOT EXISTS `value_settings` (
  `user_id` text PRIMARY KEY NOT NULL,
  `design_rate_cents` integer DEFAULT 20000,
  `content_rate_cents` integer DEFAULT 18000,
  `sales_rate_cents` integer DEFAULT 12000,
  `strategic_rate_cents` integer DEFAULT 13600,
  `other_rate_cents` integer DEFAULT 10000,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);