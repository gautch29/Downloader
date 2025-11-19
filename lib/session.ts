import { cookies } from 'next/headers';
import { validateSession } from './auth';

const SESSION_COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function getSession(): Promise<number | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
        console.log('[getSession] No session cookie found');
        return null;
    }

    const userId = await validateSession(sessionId);
    if (!userId) {
        console.log('[getSession] Session validation failed for ID:', sessionId);
    }
    return userId;
}

export async function setSession(sessionId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: false, // Allow non-HTTPS for local network access
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
    });
}

export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
