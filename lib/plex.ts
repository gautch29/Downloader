import ky from 'ky';
import { getSettings } from './settings';

export async function scanPlexLibrary() {
    const settings = await getSettings();

    if (!settings?.plexUrl || !settings?.plexToken) {
        console.log('Plex settings not configured. Skipping scan.');
        return;
    }

    try {
        // Ensure URL doesn't end with slash
        const baseUrl = settings.plexUrl.replace(/\/$/, '');

        // Trigger library refresh
        // Endpoint: /library/sections/all/refresh
        await ky.get(`${baseUrl}/library/sections/all/refresh`, {
            searchParams: {
                'X-Plex-Token': settings.plexToken
            },
            timeout: 5000
        });

        console.log('Plex library scan triggered successfully.');
    } catch (error: any) {
        console.error('Failed to trigger Plex scan:', error.message);
    }
}
