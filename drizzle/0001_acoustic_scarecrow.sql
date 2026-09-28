CREATE TABLE `atlas_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`label` text NOT NULL,
	`document` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `atlas_versions_owner_created` ON `atlas_versions` (`owner`,`created_at`);