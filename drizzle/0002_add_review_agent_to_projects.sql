ALTER TABLE `projects` ADD COLUMN `review_agent_provider` text;
--> statement-breakpoint
ALTER TABLE `projects` ADD COLUMN `review_agent_enabled` integer NOT NULL DEFAULT 0;
