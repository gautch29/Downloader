import bcrypt from 'bcrypt';
import { db } from './db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function createSession(userId: number): Promise<string> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await db.insert(sessions).values({
        id: sessionId,
        userId,
        expiresAt,
    });

    return sessionId;
}

export async function validateSession(sessionId: string): Promise<number | null> {
    const session = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) {
        await deleteSession(sessionId);
        return null;
    }

    return session.userId;
}

export async function deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function getUserByUsername(username: string) {
    return db.query.users.findFirst({
        where: eq(users.username, username),
    });
}
