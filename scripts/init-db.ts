import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Use the same database location as the main app
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), '..', 'downloader-data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory: ${DATA_DIR}`);
}

const DB_PATH = join(DATA_DIR, 'downloader.db');
console.log(`Initializing database at: ${DB_PATH}\n`);

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

// Run migrations
console.log('Running migrations...');
migrate(db, { migrationsFolder: './drizzle' });

console.log('✓ Database initialized successfully!');
console.log('\nYou can now:');
console.log('  - Add a user: npm run add-user');
console.log('  - List users: npm run list-users');
console.log('  - Start the app: npm start');

process.exit(0);
