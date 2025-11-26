'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const API_URL = 'http://localhost:8080/api';

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Username and password are required' };
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.reason || 'Invalid credentials' };
        }

        // Cookie is set by the API response and forwarded by Next.js automatically in Server Actions?
        // Actually, Server Actions running on Node need to manually set cookies if they are proxying.
        // But here we are calling from the server.
        // The Swift API returns a Set-Cookie header. We need to capture it and set it in Next.js.

        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
            // Parse simple cookie (session_id=...; Path=/; HttpOnly)
            const match = setCookieHeader.match(/session_id=([^;]+)/);
            if (match) {
                const cookieStore = await cookies();
                cookieStore.set('session_id', match[1], {
                    httpOnly: true,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 7 // 7 days
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Login failed' };
    }
}

export async function logoutAction() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {
        // Ignore error
    }

    const cookieStore = await cookies();
    cookieStore.delete('session_id');
    redirect('/login');
}
