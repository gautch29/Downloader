import { db } from '../lib/db.js';
import { users } from '../db/schema.js';
import { hashPassword } from '../lib/auth.js';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function addUser() {
    console.log('\n=== Add New User ===\n');

    const username = await question('Username: ');
    if (!username.trim()) {
        console.error('Error: Username cannot be empty');
        rl.close();
        process.exit(1);
    }

    const password = await question('Password: ');
    if (!password.trim()) {
        console.error('Error: Password cannot be empty');
        rl.close();
        process.exit(1);
    }

    try {
        const passwordHash = await hashPassword(password);

        await db.insert(users).values({
            username: username.trim(),
            passwordHash,
        });

        console.log(`\n✅ User "${username}" created successfully!`);
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            console.error(`\n❌ Error: Username "${username}" already exists`);
        } else {
            console.error('\n❌ Error creating user:', error.message);
        }
        process.exit(1);
    }

    rl.close();
    process.exit(0);
}

addUser().catch(console.error);
