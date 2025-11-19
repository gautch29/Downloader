'use server';

import { db } from '@/lib/db';
import { downloads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function cancelDownload(id: number) {
    await db.update(downloads)
        .set({
            status: 'error',
            error: 'Cancelled by user',
            updatedAt: new Date()
        })
        .where(eq(downloads.id, id));

    revalidatePath('/');
}
