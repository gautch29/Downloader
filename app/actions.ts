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

import fs from 'fs';

export interface StorageInfo {
    name: string;
    path: string;
    total: number;
    free: number;
    used: number;
    percent: number;
}

export async function getZfsStorageInfo(): Promise<StorageInfo[]> {
    const paths = [
        { name: 'PlexZFS', path: '/mnt/PlexZFS' },
        { name: 'PlexZFS2', path: '/mnt/PlexZFS2' },
        { name: 'PlexZFS3', path: '/mnt/PlexZFS3' },
        { name: 'PlexZFS4', path: '/mnt/PlexZFS4' },
    ];

    const storageInfos: StorageInfo[] = [];

    for (const item of paths) {
        try {
            const stats = await new Promise<fs.StatsFs>((resolve, reject) => {
                fs.statfs(item.path, (err, stats) => {
                    if (err) reject(err);
                    else resolve(stats);
                });
            });

            const total = stats.blocks * stats.bsize;
            const free = stats.bfree * stats.bsize;
            const used = total - free;
            const percent = total > 0 ? (used / total) * 100 : 0;

            storageInfos.push({
                name: item.name,
                path: item.path,
                total,
                free,
                used,
                percent
            });
        } catch (error) {
            console.error(`Failed to get storage info for ${item.path}:`, error);
            // Push a placeholder or skip? Let's skip for now or push zeroed info if we want to show it's missing
            // User probably wants to see it even if empty/error to know it's not working
            storageInfos.push({
                name: item.name,
                path: item.path,
                total: 0,
                free: 0,
                used: 0,
                percent: 0
            });
        }
    }

    return storageInfos;
}
