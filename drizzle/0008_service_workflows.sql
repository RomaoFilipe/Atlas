CREATE TABLE `atlas_checklist_templates` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`site` text NOT NULL,
	`name` text NOT NULL,
	`items` text NOT NULL,
	`revision` integer NOT NULL,
	`active` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `atlas_deliveries` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`unit` text NOT NULL,
	`version` integer NOT NULL,
	`revision` integer NOT NULL,
	`status` text NOT NULL,
	`title` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`commit_token` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `atlas_delivery_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`delivery_id` text NOT NULL,
	`version` integer NOT NULL,
	`actor` text NOT NULL,
	`decision` text NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `atlas_delivery_events_item` ON `atlas_delivery_events` (`owner`,`delivery_id`,`id`);--> statement-breakpoint
CREATE TABLE `atlas_delivery_versions` (
	`owner` text NOT NULL,
	`delivery_id` text NOT NULL,
	`version` integer NOT NULL,
	`document` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner`, `delivery_id`, `version`)
);
--> statement-breakpoint
CREATE TABLE `atlas_file_registry` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`site` text NOT NULL,
	`uploader` text NOT NULL,
	`document` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`, `site`)
);
--> statement-breakpoint
CREATE TABLE `atlas_maintenance_plans` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`site` text NOT NULL,
	`document` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	`commit_token` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE INDEX `atlas_maintenance_site` ON `atlas_maintenance_plans` (`owner`,`site`);--> statement-breakpoint
CREATE TABLE `atlas_notification_preferences` (
	`owner` text NOT NULL,
	`actor` text NOT NULL,
	`document` text NOT NULL,
	PRIMARY KEY(`owner`, `actor`)
);
--> statement-breakpoint
CREATE TABLE `atlas_notifications` (
	`owner` text NOT NULL,
	`actor` text NOT NULL,
	`id` text NOT NULL,
	`category` text NOT NULL,
	`site` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`target` text NOT NULL,
	`read_at` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner`, `actor`, `id`)
);
--> statement-breakpoint
CREATE INDEX `atlas_notifications_inbox` ON `atlas_notifications` (`owner`,`actor`,`created_at`);--> statement-breakpoint
ALTER TABLE `atlas_tasks` ADD `checklist` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `atlas_tasks` ADD `plan_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `atlas_tasks` ADD `occurrence_date` text DEFAULT '' NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_file_registry(owner,id,site,uploader,document,created_at) SELECT e.owner,json_extract(a.value,'$.id'),COALESCE(e.site,''),'migration',a.value,datetime('now') FROM atlas_entities e,json_each(e.document,'$.attachments') a WHERE e.kind='devices';
--> statement-breakpoint
INSERT OR IGNORE INTO atlas_file_registry(owner,id,site,uploader,document,created_at) SELECT owner,json_extract(document,'$.plan.asset'),COALESCE(site,''),'migration',json_object('id',json_extract(document,'$.plan.asset'),'name','Planta','type','image'),datetime('now') FROM atlas_entities WHERE kind='floors' AND json_extract(document,'$.plan.asset') IS NOT NULL;
--> statement-breakpoint
CREATE TRIGGER atlas_delivery_versions_no_update BEFORE UPDATE ON atlas_delivery_versions BEGIN SELECT RAISE(ABORT,'Delivery versions are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER atlas_delivery_versions_no_delete BEFORE DELETE ON atlas_delivery_versions BEGIN SELECT RAISE(ABORT,'Delivery versions are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER atlas_delivery_events_no_update BEFORE UPDATE ON atlas_delivery_events BEGIN SELECT RAISE(ABORT,'Delivery events are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER atlas_delivery_events_no_delete BEFORE DELETE ON atlas_delivery_events BEGIN SELECT RAISE(ABORT,'Delivery events are immutable'); END;
