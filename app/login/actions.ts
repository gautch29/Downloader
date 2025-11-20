'use server';

import { redirect } from 'next/navigation';
import { getUserByUsername, verifyPassword, createSession, deleteSession } from '@/lib/auth';
import { setSession, clearSession, getSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Username and password are required' };
    }

    const user = await getUserByUsername(username);
    if (!user) {
        return { error: 'Invalid username or password' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return { error: 'Invalid username or password' };
    }

    const sessionId = await createSession(user.id);
    await setSession(sessionId);

    return { success: true };
}

export async function logoutAction() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
        await deleteSession(sessionId);
    }

    await clearSession();
    redirect('/login');
}
