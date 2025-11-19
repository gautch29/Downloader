import ky from 'ky';
import { getSettings } from './settings';

export async function scanPlexLibrary() {
    console.log('[Plex] Starting scan request...');
    const settings = await getSettings();

    if (!settings?.plexUrl || !settings?.plexToken) {
        console.log('[Plex] Settings not configured. Skipping scan. URL:', settings?.plexUrl ? 'Set' : 'Missing', 'Token:', settings?.plexToken ? 'Set' : 'Missing');
        return;
    }

    try {
        // Ensure URL doesn't end with slash
        const baseUrl = settings.plexUrl.replace(/\/$/, '');
        const url = `${baseUrl}/library/sections/all/refresh`;

        console.log(`[Plex] Sending request to: ${url}`);

        // Trigger library refresh
        // Endpoint: /library/sections/all/refresh
        await ky.get(url, {
            searchParams: {
                'X-Plex-Token': settings.plexToken
            },
            timeout: 5000
        });

        console.log('[Plex] Library scan triggered successfully.');
    } catch (error: any) {
        console.error('[Plex] Failed to trigger scan:', error.message);
        if (error.response) {
            console.error('[Plex] Response status:', error.response.status);
            try {
                console.error('[Plex] Response body:', await error.response.text());
            } catch (e) { /* ignore */ }
        }
    }
}
