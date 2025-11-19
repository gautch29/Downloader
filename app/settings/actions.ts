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
