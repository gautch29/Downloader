import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { join } from 'path';

// Use the same database location as the main app
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), '..', 'downloader-data');
const DB_PATH = join(DATA_DIR, 'downloader.db');

console.log(`Using database at: ${DB_PATH}\n`);

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

async function cleanupErrors() {
    try {
        console.log('Checking for errored downloads...');

        // First count them
        const erroredDownloads = await db.select().from(schema.downloads).where(eq(schema.downloads.status, 'error'));

        if (erroredDownloads.length === 0) {
            console.log('No errored downloads found.');
            return;
        }

        console.log(`Found ${erroredDownloads.length} errored download(s). Removing them...`);

        // Delete them
        const result = await db.delete(schema.downloads).where(eq(schema.downloads.status, 'error'));

        console.log('Successfully removed errored downloads.');
    } catch (error) {
        console.error('Error cleaning up downloads:', error);
        process.exit(1);
    }
}

cleanupErrors();
