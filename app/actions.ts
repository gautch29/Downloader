'use server';

import { revalidatePath } from 'next/cache';

const API_URL = 'http://localhost:8080/api';

export async function addDownload(formData: FormData) {
    const url = formData.get('url') as string;
    const customFilename = formData.get('customFilename') as string | null;
    const targetPath = formData.get('targetPath') as string | null;

    if (!url) {
        throw new Error('URL is required');
    }

    try {
        const response = await fetch(`${API_URL}/downloads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                customFilename: customFilename || null,
                targetPath: targetPath || null,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add download: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Failed to add download:', error);
        throw error;
    }

    revalidatePath('/');
}

export async function getDownloads() {
    try {
        const response = await fetch(`${API_URL}/downloads`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch downloads:', response.statusText);
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch downloads:', error);
        return [];
    }
}

import fs from 'fs';
import { getConfig } from '@/lib/config';

export interface StorageInfo {
    name: string;
    path: string;
    total: number;
    free: number;
    used: number;
    percent: number;
}

export async function getZfsStorageInfo(): Promise<StorageInfo[]> {
    const config = getConfig();
    const paths = config.storage;

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
