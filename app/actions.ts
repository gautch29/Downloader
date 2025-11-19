'use server';

import { db } from '@/lib/db';
import { downloads } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { desc } from 'drizzle-orm';

export async function addDownload(formData: FormData) {
    const url = formData.get('url') as string;
    const customFilename = formData.get('customFilename') as string | null;
    const targetPath = formData.get('targetPath') as string | null;

    if (!url) {
        throw new Error('URL is required');
    }

    await db.insert(downloads).values({
        url,
        customFilename: customFilename || null,
        targetPath: targetPath || null,
        status: 'pending',
    });

    revalidatePath('/');
}

export async function getDownloads() {
    return await db.select().from(downloads).orderBy(desc(downloads.createdAt));
}
