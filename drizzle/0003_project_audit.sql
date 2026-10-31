CREATE TABLE `atlas_audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`actor` text NOT NULL,
	`revision` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`operation` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `atlas_audit_owner_id` ON `atlas_audit_events` (`owner`,`id`);