import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const userId = await getSession();

        if (!userId) {
            return NextResponse.json(
                { authenticated: false, user: null },
                { status: 200 }
            );
        }

        // Get user from database
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return NextResponse.json(
                { authenticated: false, user: null },
                { status: 200 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                username: user.username
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to get session' },
            { status: 500 }
        );
    }
}
