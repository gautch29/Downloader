import { db } from '../lib/db.js';
import { downloads } from '../db/schema.js';
import { desc } from 'drizzle-orm';

async function checkDownloads() {
    const allDownloads = await db.select().from(downloads).orderBy(desc(downloads.id)).limit(3);

    console.log('\n=== Latest Downloads ===');
    allDownloads.forEach(d => {
        console.log(`\nID: ${d.id}`);
        console.log(`Filename: ${d.filename || 'null'}`);
        console.log(`Custom Filename: ${d.customFilename || 'null'}`);
        console.log(`Status: ${d.status}`);
        console.log(`Progress: ${d.progress}%`);
        console.log(`Size: ${d.size ? (d.size / 1024 / 1024).toFixed(1) + ' MB' : 'null'}`);
        console.log(`URL: ${d.url}`);
    });

    process.exit(0);
}

checkDownloads().catch(console.error);
