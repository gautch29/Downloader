import { getConfig, updateServiceConfig } from '@/lib/config';

export async function getSettings() {
    const config = getConfig();
    return {
        plexUrl: config.services.plex.url,
        plexToken: config.services.plex.token,
    };
}

export async function updateSettings(plexUrl: string, plexToken: string) {
    updateServiceConfig('plex', {
        url: plexUrl,
        token: plexToken,
    });
}

