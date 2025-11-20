import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join, resolve } from 'path';
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

// Check if migrations folder exists
const migrationsFolder = resolve(process.cwd(), 'drizzle');
console.log(`Looking for migrations in: ${migrationsFolder}`);

if (!existsSync(migrationsFolder)) {
    console.error(`ERROR: Migrations folder not found at ${migrationsFolder}`);
    console.error('Make sure you are running this from the project root directory.');
    process.exit(1);
}

// Run migrations
console.log('Running migrations...');
try {
    migrate(db, { migrationsFolder });
    console.log('✓ Migrations applied successfully!');
} catch (error: any) {
    console.error('ERROR running migrations:', error.message);
    process.exit(1);
}

// Verify tables were created
console.log('\nVerifying tables...');
const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables created:');
tables.forEach((table: any) => {
    console.log(`  - ${table.name}`);
});

console.log('\n✓ Database initialized successfully!');
console.log('\nYou can now:');
console.log('  - Add a user: npm run add-user');
console.log('  - List users: npm run list-users');
console.log('  - Start the app: npm start');

process.exit(0);
