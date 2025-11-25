'use server';

import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

    const userId = await getSession();
    if (!userId) {
        return { error: 'Not authenticated' };
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        return { error: 'User not found' };
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
        return { error: 'Current password is incorrect' };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db.update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, userId));

    revalidatePath('/');
    return { success: true };
}

import { updateSettings, getSettings as getSettingsDb } from '@/lib/settings';

export async function updateSettingsAction(formData: FormData) {
    const plexUrl = formData.get('plexUrl') as string;
    const plexToken = formData.get('plexToken') as string;

    const userId = await getSession();
    if (!userId) {
        return { error: 'Not authenticated' };
    }

    try {
        await updateSettings(plexUrl, plexToken);
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { error: 'Failed to update settings: ' + error.message };
    }
}

export async function getSettingsAction() {
    const userId = await getSession();
    if (!userId) {
        return null;
    }
    return getSettingsDb();
}

import { getPathShortcuts } from '@/lib/path-config';
import fs from 'fs';

export interface StorageInfo {
    name: string;
    path: string;
    total: number;
    free: number;
    used: number;
    percent: number;
}

export async function getStorageInfoAction(): Promise<StorageInfo[]> {
    const userId = await getSession();
    if (!userId) {
        return [];
    }

    const shortcuts = getPathShortcuts();
    const storageInfos: StorageInfo[] = [];

    // Filter out shortcuts with empty paths or that are just "Downloads" if it's not a mount
    // For now, let's check all configured paths that are absolute
    const validShortcuts = shortcuts.filter(s => s.path && s.path.startsWith('/'));

    for (const shortcut of validShortcuts) {
        try {
            // Use fs.statfs to get filesystem stats
            // We need to wrap it in a promise since it's callback-based in some node versions or just to be safe
            const stats = await new Promise<fs.StatsFs>((resolve, reject) => {
                fs.statfs(shortcut.path, (err, stats) => {
                    if (err) reject(err);
                    else resolve(stats);
                });
            });

            const total = stats.blocks * stats.bsize;
            const free = stats.bfree * stats.bsize; // Free blocks available to non-privileged user
            const used = total - free;
            const percent = total > 0 ? (used / total) * 100 : 0;

            storageInfos.push({
                name: shortcut.name,
                path: shortcut.path,
                total,
                free,
                used,
                percent
            });
        } catch (error) {
            console.error(`Failed to get storage info for ${shortcut.path}:`, error);
            // Skip this path if we can't read it
        }
    }

    return storageInfos;
}
