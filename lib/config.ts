import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'settings.json');

export interface ZfsPath {
    name: string;
    path: string;
}

export interface PathShortcut {
    id: string;
    name: string;
    path: string;
}

export interface ServiceConfig {
    zoneTelechargement: {
        baseUrl: string;
    };
    plex: {
        url: string;
        token: string;
    };
}

export interface AppConfig {
    storage: ZfsPath[];
    services: ServiceConfig;
    downloadPaths: PathShortcut[];
}

const DEFAULT_CONFIG: AppConfig = {
    storage: [
        { name: 'PlexZFS', path: '/mnt/PlexZFS' },
        { name: 'PlexZFS2', path: '/mnt/PlexZFS2' },
        { name: 'PlexZFS3', path: '/mnt/PlexZFS3' },
        { name: 'PlexZFS4', path: '/mnt/PlexZFS4' },
    ],
    services: {
        zoneTelechargement: {
            baseUrl: 'https://zone-telechargement.irish',
        },
        plex: {
            url: '',
            token: '',
        },
    },
    downloadPaths: [
        { id: 'downloads', name: 'Downloads', path: '' },
        { id: 'movies', name: 'Movies', path: '/mnt/media/Movies' },
        { id: 'tv', name: 'TV Shows', path: '/mnt/media/TV' },
        { id: 'music', name: 'Music', path: '/mnt/media/Music' },
        { id: 'documents', name: 'Documents', path: '/mnt/media/Documents' },
    ],
};

function ensureConfigExists() {
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4));
    }
}

export function getConfig(): AppConfig {
    ensureConfigExists();
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(data);
        // Merge with default to ensure all fields exist (simple shallow merge for now)
        return {
            ...DEFAULT_CONFIG,
            ...config,
            services: {
                ...DEFAULT_CONFIG.services,
                ...config.services,
                zoneTelechargement: {
                    ...DEFAULT_CONFIG.services.zoneTelechargement,
                    ...config.services?.zoneTelechargement,
                },
                plex: {
                    ...DEFAULT_CONFIG.services.plex,
                    ...config.services?.plex,
                }
            },
            downloadPaths: config.downloadPaths || DEFAULT_CONFIG.downloadPaths,
        };
    } catch (error) {
        console.error('Failed to read config file:', error);
        return DEFAULT_CONFIG;
    }
}

export function updateConfig(updates: Partial<AppConfig>): void {
    ensureConfigExists();
    const currentConfig = getConfig();
    const newConfig = {
        ...currentConfig,
        ...updates,
        services: {
            ...currentConfig.services,
            ...updates.services,
        }
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 4));
}

export function updateServiceConfig(service: keyof ServiceConfig, updates: Partial<ServiceConfig[keyof ServiceConfig]>): void {
    ensureConfigExists();
    const currentConfig = getConfig();
    const newConfig = {
        ...currentConfig,
        services: {
            ...currentConfig.services,
            [service]: {
                ...currentConfig.services[service],
                ...updates,
            }
        }
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 4));
}

// Helper functions for download paths to replace lib/path-config.ts
export function getPathShortcuts(): PathShortcut[] {
    return getConfig().downloadPaths;
}

export function addPathShortcut(name: string, pathValue: string): void {
    const config = getConfig();
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const newPaths = [...config.downloadPaths, { id, name, path: pathValue }];
    updateConfig({ downloadPaths: newPaths });
}

export function deletePathShortcut(id: string): void {
    const config = getConfig();
    const newPaths = config.downloadPaths.filter(s => s.id !== id);
    updateConfig({ downloadPaths: newPaths });
}

export function updatePathShortcut(id: string, name: string, pathValue: string): void {
    const config = getConfig();
    const newPaths = config.downloadPaths.map(s => {
        if (s.id === id) {
            return { ...s, name, path: pathValue };
        }
        return s;
    });
    updateConfig({ downloadPaths: newPaths });
}
