import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const downloads = sqliteTable('downloads', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    url: text('url').notNull(),
    filename: text('filename'),
    customFilename: text('custom_filename'),
    targetPath: text('target_path'),
    status: text('status', { enum: ['pending', 'downloading', 'completed', 'error'] }).default('pending').notNull(),
    progress: integer('progress').default(0).notNull(),
    size: integer('size'),
    error: text('error'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    plexUrl: text('plex_url'),
    plexToken: text('plex_token'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type Download = typeof downloads.$inferSelect;
export type NewDownload = typeof downloads.$inferInsert;
