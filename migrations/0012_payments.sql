-- Payments table
CREATE TABLE IF NOT EXISTS `payments` (
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