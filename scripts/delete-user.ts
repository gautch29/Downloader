import { db } from '../lib/db.js';
import { users } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function deleteUser() {
    console.log('\n=== Delete User ===\n');

    // List all users
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    if (allUsers.length === 0) {
        console.log('No users found.\n');
        rl.close();
        process.exit(0);
    }

    console.log('Existing users:');
    allUsers.forEach((user) => {
        console.log(`  ${user.id}. ${user.username}`);
    });

    const userIdStr = await question('\nEnter user ID to delete (or "cancel"): ');

    if (userIdStr.toLowerCase() === 'cancel') {
        console.log('Cancelled.');
        rl.close();
        process.exit(0);
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
        console.error('Error: Invalid user ID');
        rl.close();
        process.exit(1);
    }

    const user = allUsers.find((u) => u.id === userId);
    if (!user) {
        console.error(`Error: User with ID ${userId} not found`);
        rl.close();
        process.exit(1);
    }

    const confirm = await question(`\nAre you sure you want to delete "${user.username}"? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes') {
        console.log('Cancelled.');
        rl.close();
        process.exit(0);
    }

    try {
        await db.delete(users).where(eq(users.id, userId));
        console.log(`\n✅ User "${user.username}" deleted successfully!`);
    } catch (error: any) {
        console.error('\n❌ Error deleting user:', error.message);
        process.exit(1);
    }

    rl.close();
    process.exit(0);
}

deleteUser().catch(console.error);
