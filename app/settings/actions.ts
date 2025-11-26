'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_URL = 'http://localhost:8080/api';

export async function changePasswordAction(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: 'All fields are required' };
    }

    if (newPassword !== confirmPassword) {
        return { error: 'New passwords do not match' };
    }

    if (newPassword.length < 6) {
        return { error: 'Password must be at least 6 characters' };
    }

    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        const response = await fetch(`${API_URL}/auth/password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${sessionId}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return { error: data.reason || 'Failed to change password' };
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: 'Failed to change password: ' + error.message };
    }
}

export async function updateSettingsAction(formData: FormData) {
    const plexUrl = formData.get('plexUrl') as string;
    const plexToken = formData.get('plexToken') as string;

    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        const response = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${sessionId}`
            },
            body: JSON.stringify({ plexUrl, plexToken })
        });

        if (!response.ok) {
            return { error: 'Failed to update settings' };
        }

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { error: 'Failed to update settings: ' + error.message };
    }
}

export async function getSettingsAction() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        const response = await fetch(`${API_URL}/settings`, {
            headers: { 'Cookie': `session_id=${sessionId}` }
        });

        if (!response.ok) return null;

        const data = await response.json();
        // Return raw settings for the form (including token if needed, but usually we don't send token back to client for security unless necessary for edit)
        // The previous implementation returned { plexUrl, plexToken }
        return {
            plexUrl: data.plexUrl,
            plexToken: data.plexToken
        };
    } catch (error) {
        return null;
    }
}


