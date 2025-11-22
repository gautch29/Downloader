import 'dotenv/config';
import { db } from './lib/db';
import { downloads } from './db/schema';
import { eq } from 'drizzle-orm';
import { oneFichier } from './lib/1fichier';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import ky from 'ky';
import { scanPlexLibrary } from './lib/plex';

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

            // Speed calculation variables
            let lastSpeedBytes = 0;
            let lastSpeedTime = Date.now();

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
                        // Calculate speed and ETA
                        const timeDiff = (now - lastSpeedTime) / 1000; // seconds
                        const bytesDiff = downloadedBytes - lastSpeedBytes;

                        let speed = 0;
                        let eta = 0;

                        if (timeDiff > 0) {
                            speed = Math.floor(bytesDiff / timeDiff); // bytes per second

                            if (speed > 0 && totalBytes > 0) {
                                const remainingBytes = totalBytes - downloadedBytes;
                                eta = Math.floor(remainingBytes / speed); // seconds
                            }
                        }

                        // Reset speed tracking variables
                        lastSpeedBytes = downloadedBytes;
                        lastSpeedTime = now;
                        lastProgressUpdate = now;

                        try {
                            await db.update(downloads)
                                .set({
                                    progress: progressPercent,
                                    speed: speed,
                                    eta: eta,
                                    updatedAt: new Date()
                                })
                                .where(eq(downloads.id, download.id));

                            console.log(`Download ${download.id}: ${progressPercent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)}MB / ${(totalBytes / 1024 / 1024).toFixed(1)}MB) - ${(speed / 1024 / 1024).toFixed(2)} MB/s - ETA: ${eta}s`);
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
                // Priority 1: Filename from 1fichier API (stored in database)
                // Priority 2: Content-Disposition header
                // Priority 3: URL path
                // Priority 4: Generated name

                if (download.filename) {
                    filename = download.filename;
                } else {
                    // Try to get filename from Content-Disposition header
                    const contentDisposition = response.headers.get('content-disposition');
                    if (contentDisposition) {
                        // Parse: Content-Disposition: attachment; filename="example.zip"
                        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                        if (filenameMatch && filenameMatch[1]) {
                            filename = filenameMatch[1].replace(/['"]/g, '');
                        }
                    }

                    // Fallback to URL path or generated name
                    if (!filename) {
                        filename = path.basename(new URL(directLink).pathname) || `file-${download.id}`;
                    }
                }
            }

            // Remove any path separators from filename for security
            filename = path.basename(filename);

            // Update filename in database immediately so UI can show it
            try {
                await db.update(downloads)
                    .set({ filename: filename })
                    .where(eq(downloads.id, download.id));
            } catch (dbError) {
                console.error(`Failed to update filename in DB:`, dbError);
            }

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
                if (!fs.existsSync(targetDir)) {
                    console.log(`Creating directory: ${targetDir}`);
                    fs.mkdirSync(targetDir, { recursive: true, mode: 0o777 });
                }

                // Check write permissions
                try {
                    fs.accessSync(targetDir, fs.constants.W_OK);
                } catch (err) {
                    console.log(`Directory ${targetDir} is not writable. Attempting to fix permissions...`);
                    try {
                        fs.chmodSync(targetDir, '777');
                        console.log(`Permissions fixed for ${targetDir}`);
                    } catch (chmodErr: any) {
                        console.error(`Failed to fix permissions for ${targetDir}:`, chmodErr.message);
                        console.warn(`Falling back to default download directory: ${DOWNLOAD_DIR}`);
                        targetDir = DOWNLOAD_DIR;

                        // Ensure default dir exists
                        if (!fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                        }
                    }
                }
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

            // Trigger Plex scan
            console.log('Attempting to trigger Plex scan...');
            await scanPlexLibrary();
            console.log('Plex scan trigger function returned.');

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
