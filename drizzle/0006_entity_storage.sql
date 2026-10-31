-- Canonical storage: project metadata and indexed entities; legacy documents are retained as migration backups.
CREATE TABLE atlas_workspaces(owner TEXT PRIMARY KEY, metadata TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL, actor TEXT NOT NULL, commit_token TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE atlas_entities(owner TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL, position INTEGER NOT NULL, document TEXT NOT NULL, site TEXT, floor TEXT, room TEXT, name TEXT, search TEXT, PRIMARY KEY(owner,kind,id));
--> statement-breakpoint
CREATE INDEX atlas_entities_floor ON atlas_entities(owner,kind,floor,position);
--> statement-breakpoint
CREATE INDEX atlas_entities_site ON atlas_entities(owner,kind,site,position);
--> statement-breakpoint
CREATE INDEX atlas_entities_room ON atlas_entities(owner,kind,room,position);
--> statement-breakpoint
INSERT INTO atlas_workspaces SELECT owner,json_set(json_remove(document,'$.sites','$.floors','$.rooms','$.racks','$.devices','$.links','$.nets','$.templates','$.connectionProposals'),'$._atlasLists',json((SELECT json_group_array(value) FROM json_each('["sites","floors","rooms","racks","devices","links","nets","templates","connectionProposals"]') WHERE json_type(atlas_projects.document,'$.'||value)='array'))),revision,updated_at,COALESCE(actor,owner),'migration' FROM atlas_projects;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'sites',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.sites') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'floors',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.floors') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'rooms',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.rooms') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'racks',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.racks') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'devices',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.devices') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'links',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.links') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'nets',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.nets') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'templates',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.templates') e;
--> statement-breakpoint
INSERT INTO atlas_entities SELECT p.owner,'connectionProposals',CAST(json_extract(e.value,'$.id') AS TEXT),CAST(e.key AS INTEGER),e.value,json_extract(e.value,'$.site'),json_extract(e.value,'$.floor'),json_extract(e.value,'$.room'),COALESCE(json_extract(e.value,'$.name'),''),lower(e.value) FROM atlas_projects p,json_each(p.document,'$.connectionProposals') e;
--> statement-breakpoint
CREATE TRIGGER atlas_entity_audit_insert AFTER INSERT ON atlas_entities BEGIN INSERT INTO atlas_audit_events(owner,actor,revision,entity_type,entity_id,operation,before_json,after_json,created_at) SELECT w.owner,w.actor,w.revision,NEW.kind,NEW.id,'create',NULL,NEW.document,w.updated_at FROM atlas_workspaces w WHERE w.owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER atlas_entity_audit_update AFTER UPDATE ON atlas_entities WHEN OLD.document <> NEW.document BEGIN INSERT INTO atlas_audit_events(owner,actor,revision,entity_type,entity_id,operation,before_json,after_json,created_at) SELECT w.owner,w.actor,w.revision,NEW.kind,NEW.id,'update',OLD.document,NEW.document,w.updated_at FROM atlas_workspaces w WHERE w.owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER atlas_entity_audit_delete AFTER DELETE ON atlas_entities BEGIN INSERT INTO atlas_audit_events(owner,actor,revision,entity_type,entity_id,operation,before_json,after_json,created_at) SELECT w.owner,w.actor,w.revision,OLD.kind,OLD.id,'delete',OLD.document,NULL,w.updated_at FROM atlas_workspaces w WHERE w.owner=OLD.owner; END;
--> statement-breakpoint
CREATE TRIGGER atlas_workspace_audit_insert AFTER INSERT ON atlas_workspaces BEGIN INSERT INTO atlas_audit_events(owner,actor,revision,entity_type,entity_id,operation,before_json,after_json,created_at) VALUES(NEW.owner,NEW.actor,NEW.revision,'project','project','insert',NULL,json_remove(NEW.metadata,'$._atlasLists'),NEW.updated_at); END;
--> statement-breakpoint
CREATE TRIGGER atlas_workspace_audit_update AFTER UPDATE ON atlas_workspaces WHEN json_remove(OLD.metadata,'$._atlasLists') <> json_remove(NEW.metadata,'$._atlasLists') BEGIN INSERT INTO atlas_audit_events(owner,actor,revision,entity_type,entity_id,operation,before_json,after_json,created_at) VALUES(NEW.owner,NEW.actor,NEW.revision,'project','project','update',json_remove(OLD.metadata,'$._atlasLists'),json_remove(NEW.metadata,'$._atlasLists'),NEW.updated_at); END;
--> statement-breakpoint
