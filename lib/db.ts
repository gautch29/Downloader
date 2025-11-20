import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Store database in a persistent location outside the project
// This prevents it from being wiped during builds or git operations
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), '..', 'downloader-data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[DB] Created data directory: ${DATA_DIR}`);
}

const DB_PATH = join(DATA_DIR, 'downloader.db');
console.log(`[DB] Using database at: ${DB_PATH}`);

const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });
