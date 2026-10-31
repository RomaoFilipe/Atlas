import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const projects=sqliteTable('atlas_projects',{owner:text('owner').primaryKey(),actor:text('actor'),document:text('document').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull()});

export const versions=sqliteTable('atlas_versions',{id:text('id').primaryKey(),owner:text('owner').notNull(),label:text('label').notNull(),document:text('document').notNull(),createdAt:text('created_at').notNull()},table=>[index('atlas_versions_owner_created').on(table.owner,table.createdAt)]);

export const projectHistory=sqliteTable('atlas_project_history',{id:text('id').primaryKey(),owner:text('owner').notNull(),revision:integer('revision').notNull(),document:text('document').notNull(),createdAt:text('created_at').notNull()},table=>[index('atlas_history_owner_revision').on(table.owner,table.revision)]);

export const auditEvents=sqliteTable('atlas_audit_events',{
 id:integer('id').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),actor:text('actor').notNull(),revision:integer('revision').notNull(),
 entityType:text('entity_type').notNull(),entityId:text('entity_id').notNull(),operation:text('operation').notNull(),
 beforeJson:text('before_json'),afterJson:text('after_json'),createdAt:text('created_at').notNull()
},table=>[index('atlas_audit_owner_id').on(table.owner,table.id)]);

export const workspaces=sqliteTable('atlas_workspaces',{owner:text('owner').primaryKey(),metadata:text('metadata').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull(),actor:text('actor').notNull(),commitToken:text('commit_token').notNull()});
export const entities=sqliteTable('atlas_entities',{owner:text('owner').notNull(),kind:text('kind').notNull(),id:text('id').notNull(),position:integer('position').notNull(),document:text('document').notNull(),site:text('site'),floor:text('floor'),room:text('room'),name:text('name'),search:text('search')},table=>[primaryKey({columns:[table.owner,table.kind,table.id]}),index('atlas_entities_floor').on(table.owner,table.kind,table.floor,table.position),index('atlas_entities_site').on(table.owner,table.kind,table.site,table.position),index('atlas_entities_room').on(table.owner,table.kind,table.room,table.position)]);

export const tasks=sqliteTable('atlas_tasks',{owner:text('owner').notNull(),id:text('id').notNull(),site:text('site').notNull(),deviceId:text('device_id').notNull().default(''),title:text('title').notNull(),description:text('description').notNull(),status:text('status').notNull(),priority:text('priority').notNull(),assignee:text('assignee').notNull(),dueDate:text('due_date').notNull(),resolution:text('resolution').notNull(),createdBy:text('created_by').notNull(),createdAt:text('created_at').notNull(),updatedBy:text('updated_by').notNull(),updatedAt:text('updated_at').notNull(),revision:integer('revision').notNull(),commitToken:text('commit_token').notNull()},t=>[primaryKey({columns:[t.owner,t.id]}),index('atlas_tasks_site').on(t.owner,t.site,t.status,t.createdAt)]);
export const taskEvents=sqliteTable('atlas_task_events',{id:integer('id').primaryKey({autoIncrement:true}),owner:text('owner').notNull(),taskId:text('task_id').notNull(),actor:text('actor').notNull(),revision:integer('revision').notNull(),beforeJson:text('before_json'),afterJson:text('after_json').notNull(),createdAt:text('created_at').notNull()},t=>[index('atlas_task_events_task').on(t.owner,t.taskId,t.id)]);
