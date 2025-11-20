import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema';
import { users } from '../db/schema';
import { hashPassword } from '../lib/auth';
import { join } from 'path';
import * as readline from 'readline';

// Use the same database location as the main app
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), '..', 'downloader-data');
const DB_PATH = join(DATA_DIR, 'downloader.db');

console.log(`Using database at: ${DB_PATH}\n`);

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function addUser() {
    try {
        const username = await question('Enter username: ');
        const password = await question('Enter password: ');

        if (!username || !password) {
            console.log('\nUsername and password are required!');
            process.exit(1);
        }

        // Check if user already exists
        const existing = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, username)
        });

        if (existing) {
            console.log(`\nUser "${username}" already exists!`);
            process.exit(1);
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        await db.insert(users).values({
            username,
            passwordHash
        });

        console.log(`\n✓ User "${username}" created successfully!`);
        process.exit(0);
    } catch (error: any) {
        console.error('\nError creating user:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

addUser();
