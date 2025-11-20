import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/session';
import { getUserByUsername, verifyPassword as verifyPasswordHash, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Get user from database
        const user = await getUserByUsername(username);

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPasswordHash(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create session in database
        const sessionId = await createSession(user.id);

        // Set session cookie
        await setSession(sessionId);

        return NextResponse.json({
            success: true,
            user: { username: user.username }
        });
    } catch (error: any) {
        console.error('[API] Login error:', error);
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}
