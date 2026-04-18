-- Enterprise fields for Funds table
-- Migration 0009

ALTER TABLE `funds` ADD COLUMN `seat_limit` integer;
ALTER TABLE `funds` ADD COLUMN `seats_used` integer DEFAULT 0;
ALTER TABLE `funds` ADD COLUMN `sso_provider` text;
ALTER TABLE `funds` ADD COLUMN `sso_entity_id` text;
ALTER TABLE `funds` ADD COLUMN `sso_sso_url` text;
ALTER TABLE `funds` ADD COLUMN `sso_certificate` text;
ALTER TABLE `funds` ADD COLUMN `api_key` text;
ALTER TABLE `funds` ADD COLUMN `api_key_enabled` integer DEFAULT 0;
ALTER TABLE `funds` ADD COLUMN `sla_tier` text;