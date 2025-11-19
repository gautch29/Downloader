import { db } from './db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getSettings() {
    const result = await db.select().from(settings).limit(1);
    return result[0] || null;
}

export async function updateSettings(plexUrl: string, plexToken: string) {
    const currentSettings = await getSettings();

    if (currentSettings) {
        await db.update(settings)
            .set({
                plexUrl,
                plexToken,
                updatedAt: new Date(),
            })
            .where(eq(settings.id, currentSettings.id));
    } else {
        await db.insert(settings).values({
            plexUrl,
            plexToken,
        });
    }
}
