import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const projects=sqliteTable('atlas_projects',{owner:text('owner').primaryKey(),document:text('document').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull()});

export const versions=sqliteTable('atlas_versions',{id:text('id').primaryKey(),owner:text('owner').notNull(),label:text('label').notNull(),document:text('document').notNull(),createdAt:text('created_at').notNull()},table=>[index('atlas_versions_owner_created').on(table.owner,table.createdAt)]);
