CREATE TABLE `atlas_project_history` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`revision` integer NOT NULL,
	`document` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `atlas_history_owner_revision` ON `atlas_project_history` (`owner`,`revision`);
--> statement-breakpoint
-- Archive the prior state atomically and retain the latest 100 revisions per owner.
CREATE TRIGGER atlas_project_history_update AFTER UPDATE OF document ON atlas_projects
WHEN OLD.document <> NEW.document
BEGIN
 INSERT INTO atlas_project_history(id,owner,revision,document,created_at)
 VALUES(lower(hex(randomblob(16))),OLD.owner,OLD.revision,OLD.document,OLD.updated_at);
 DELETE FROM atlas_project_history WHERE owner=OLD.owner AND id NOT IN
 (SELECT id FROM atlas_project_history WHERE owner=OLD.owner ORDER BY revision DESC LIMIT 100);
END;
