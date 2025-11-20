import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema';
import { join } from 'path';

// Use the same database location as the main app
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), '..', 'downloader-data');
const DB_PATH = join(DATA_DIR, 'downloader.db');

console.log(`Using database at: ${DB_PATH}\n`);

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

async function listUsers() {
    const users = await db.query.users.findMany();

    if (users.length === 0) {
        console.log('No users found in the database.');
        console.log('\nTo create a user, run:');
        console.log('  npm run create-user');
    } else {
        console.log(`Found ${users.length} user(s):\n`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log('');
        });
    }
}

listUsers().catch(console.error);
