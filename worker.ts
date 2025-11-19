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

            // 2. Start download with progress tracking
            let lastProgressUpdate = 0;
            let totalBytes = 0;
            let downloadedBytes = 0;

            const response = await ky.get(directLink, {
                onDownloadProgress: async (progress) => {
                    // Get total size if available
                    if (totalBytes === 0 && progress.totalBytes) {
                        totalBytes = progress.totalBytes;
                        // Update database with file size
                        try {
                            await db.update(downloads)
                                .set({ size: totalBytes })
                                .where(eq(downloads.id, download.id));
                        } catch (dbError) {
                            console.error(`Failed to update file size in DB:`, dbError);
                        }
                    }

                    downloadedBytes = progress.transferredBytes;

                    // Update progress in DB every 2 seconds to avoid too many writes
                    const now = Date.now();
                    const progressPercent = progress.percent ? Math.floor(progress.percent * 100) : 0;

                    if (now - lastProgressUpdate > 2000 || progressPercent >= 99) {
                        lastProgressUpdate = now;
                        try {
                            await db.update(downloads)
                                .set({
                                    progress: progressPercent,
                                    updatedAt: new Date()
                                })
                                .where(eq(downloads.id, download.id));

                            console.log(`Download ${download.id}: ${progressPercent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)}MB / ${(totalBytes / 1024 / 1024).toFixed(1)}MB)`);
                        } catch (dbError) {
                            console.error(`Failed to update progress in DB:`, dbError);
                        }
                    }
                }
            });

            if (!response.body) throw new Error('No response body');

            // Extract filename from Content-Disposition header (like a browser would)
            let filename = download.customFilename;

            if (!filename) {
                // Try to get filename from Content-Disposition header
                const contentDisposition = response.headers.get('content-disposition');
                if (contentDisposition) {
                    // Parse: Content-Disposition: attachment; filename="example.zip"
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                }

                // Fallback to database filename, URL path, or generated name
                if (!filename) {
                    filename = download.filename || path.basename(new URL(directLink).pathname) || `file-${download.id}`;
                }
            }

            // Remove any path separators from filename for security
            filename = path.basename(filename);

            // Determine target directory
            let targetDir = DOWNLOAD_DIR;
            if (download.targetPath) {
                // If targetPath is absolute, use it directly
                // If relative, join with DOWNLOAD_DIR
                if (path.isAbsolute(download.targetPath)) {
                    targetDir = download.targetPath;
                } else {
                    targetDir = path.join(DOWNLOAD_DIR, download.targetPath);
                }

                // Ensure the directory exists
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const filePath = path.join(targetDir, filename);
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

            console.log(`Download completed: ${filePath}`);

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
