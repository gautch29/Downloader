import Database from 'better-sqlite3';
import { join } from 'path';
import fs from 'fs';

// Use the same database location as the main app
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), '..', 'downloader-data');
const DB_PATH = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:', '') : join(DATA_DIR, 'downloader.db');

console.log(`[Schema Update] Checking database at: ${DB_PATH}`);

if (!fs.existsSync(DB_PATH)) {
    console.error(`[Schema Update] Database file not found at ${DB_PATH}`);
    process.exit(1);
}

const db = new Database(DB_PATH);

function addColumnIfNotExists(tableName: string, columnName: string, columnType: string) {
    try {
        const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
        const columnExists = tableInfo.some(col => col.name === columnName);

        if (!columnExists) {
            console.log(`[Schema Update] Adding column '${columnName}' to table '${tableName}'...`);
            db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`).run();
            console.log(`[Schema Update] Successfully added column '${columnName}'.`);
        } else {
            console.log(`[Schema Update] Column '${columnName}' already exists in table '${tableName}'.`);
        }
    } catch (error: any) {
        console.error(`[Schema Update] Error adding column '${columnName}':`, error.message);
    }
}

try {
    console.log('[Schema Update] Starting schema update...');

    // Add 'speed' and 'eta' columns to 'downloads' table
    addColumnIfNotExists('downloads', 'speed', 'INTEGER');
    addColumnIfNotExists('downloads', 'eta', 'INTEGER');

    console.log('[Schema Update] Schema update completed.');
} catch (error: any) {
    console.error('[Schema Update] Critical error:', error.message);
    process.exit(1);
}
