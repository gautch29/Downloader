import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema';
import { users } from '../db/schema';
import { hashPassword } from '../lib/auth';
import { join } from 'path';

// Use the same database location as the main app
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), '..', 'downloader-data');
const DB_PATH = join(DATA_DIR, 'downloader.db');

console.log(`Using database at: ${DB_PATH}\n`);

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

async function addTestUser() {
    try {
        const username = 'test';
        const password = 'test';

        // Check if user already exists
        const existing = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, username)
        });

        if (existing) {
            console.log(`User "${username}" already exists!`);
            process.exit(0);
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        await db.insert(users).values({
            username,
            passwordHash
        });

        console.log(`✓ Test user created successfully!`);
        console.log(`  Username: ${username}`);
        console.log(`  Password: ${password}`);
        process.exit(0);
    } catch (error: any) {
        console.error('\nError creating user:', error.message);
        process.exit(1);
    }
}

addTestUser();
