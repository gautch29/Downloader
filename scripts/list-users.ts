import { db } from '../lib/db.js';
import { users } from '../db/schema.js';
import { desc } from 'drizzle-orm';

async function listUsers() {
    console.log('\n=== Registered Users ===\n');

    const allUsers = await db.select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    if (allUsers.length === 0) {
        console.log('No users found. Create one with: npm run add-user\n');
        process.exit(0);
    }

    allUsers.forEach((user) => {
        const date = user.createdAt.toLocaleDateString();
        console.log(`  ${user.id}. ${user.username} (created: ${date})`);
    });

    console.log(`\nTotal: ${allUsers.length} user(s)\n`);
    process.exit(0);
}

listUsers().catch(console.error);
