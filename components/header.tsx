import { HeaderClient } from './header-client';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function Header() {
    // Get current user
    const userId = await getSession();
    let username = 'User';

    if (userId) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (user) username = user.username;
    }

    return <HeaderClient username={username} />;
}
