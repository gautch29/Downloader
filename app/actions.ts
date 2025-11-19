'use server';

import { db } from '@/lib/db';
import { downloads } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { desc } from 'drizzle-orm';

export async function addDownload(formData: FormData) {
    const url = formData.get('url') as string;

    if (!url) {
        throw new Error('URL is required');
    }

    await db.insert(downloads).values({
        url,
        status: 'pending',
    });

    revalidatePath('/');
}

export async function getDownloads() {
    return await db.select().from(downloads).orderBy(desc(downloads.createdAt));
}
