import 'dotenv/config';
import { db } from './lib/db';
import { downloads } from './db/schema';
import { eq } from 'drizzle-orm';
import { oneFichier } from './lib/1fichier';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import ky from 'ky';

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || './downloads';

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function processQueue() {
    console.log('Checking for pending downloads...');

    try {
        const pending = await db.select().from(downloads).where(eq(downloads.status, 'pending')).limit(1);

        if (pending.length === 0) {
            return;
        }

        const download = pending[0];
        console.log(`Starting download: ${download.url}`);

        await db.update(downloads)
            .set({ status: 'downloading', updatedAt: new Date() })
            .where(eq(downloads.id, download.id));

        try {
            // 1. Get direct link
            const directLink = await oneFichier.getDownloadLink(download.url);

            // 2. Start download
            const response = await ky.get(directLink, {
                onDownloadProgress: async (progress, chunk) => {
                    // Update progress in DB periodically (e.g., every 5% or 1 second)
                    // For simplicity, we'll just log it for now or update DB sparingly
                    // to avoid locking it too much.
                    // In a real app, use a throttle.
                }
            });

            if (!response.body) throw new Error('No response body');

            const filename = download.filename || path.basename(new URL(directLink).pathname) || `file-${download.id}`;
            const filePath = path.join(DOWNLOAD_DIR, filename);
            const fileStream = fs.createWriteStream(filePath);

            // @ts-ignore - ky response body is compatible
            await pipeline(response.body, fileStream);

            await db.update(downloads)
                .set({
                    status: 'completed',
                    progress: 100,
                    filename: filename,
                    updatedAt: new Date()
                })
                .where(eq(downloads.id, download.id));

            console.log(`Download completed: ${filename}`);

        } catch (error: any) {
            console.error(`Download failed for ${download.url}:`, error);
            await db.update(downloads)
                .set({
                    status: 'error',
                    error: error.message,
                    updatedAt: new Date()
                })
                .where(eq(downloads.id, download.id));
        }

    } catch (error) {
        console.error('Worker error:', error);
    }
}

// Run every 5 seconds
setInterval(processQueue, 5000);
console.log('Worker started');
