CREATE TABLE `atlas_task_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`task_id` text NOT NULL,
	`actor` text NOT NULL,
	`revision` integer NOT NULL,
	`before_json` text,
	`after_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `atlas_task_events_task` ON `atlas_task_events` (`owner`,`task_id`,`id`);--> statement-breakpoint
CREATE TABLE `atlas_tasks` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`site` text NOT NULL,
	`device_id` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`assignee` text NOT NULL,
	`due_date` text NOT NULL,
	`resolution` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`revision` integer NOT NULL,
	`commit_token` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE INDEX `atlas_tasks_site` ON `atlas_tasks` (`owner`,`site`,`status`,`created_at`);
--> statement-breakpoint
CREATE TRIGGER atlas_task_events_no_update BEFORE UPDATE ON atlas_task_events BEGIN SELECT RAISE(ABORT,'Task events are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER atlas_task_events_no_delete BEFORE DELETE ON atlas_task_events BEGIN SELECT RAISE(ABORT,'Task events are immutable'); END;
