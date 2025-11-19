import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'paths.json');

export interface PathShortcut {
    id: string;
    name: string;
    path: string;
}

interface PathConfig {
    shortcuts: PathShortcut[];
}

// Ensure config directory and file exist
function ensureConfigExists() {
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_PATH)) {
        const defaultConfig: PathConfig = {
            shortcuts: [
                { id: 'downloads', name: 'Downloads', path: '' },
                { id: 'movies', name: 'Movies', path: '/mnt/media/Movies' },
                { id: 'tv', name: 'TV Shows', path: '/mnt/media/TV' },
                { id: 'music', name: 'Music', path: '/mnt/media/Music' },
                { id: 'documents', name: 'Documents', path: '/mnt/media/Documents' },
            ],
        };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    }
}

export function getPathShortcuts(): PathShortcut[] {
    ensureConfigExists();
    const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config: PathConfig = JSON.parse(data);
    return config.shortcuts;
}

export function addPathShortcut(name: string, pathValue: string): void {
    ensureConfigExists();
    const config: PathConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

    const id = name.toLowerCase().replace(/\s+/g, '-');
    config.shortcuts.push({ id, name, path: pathValue });

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function deletePathShortcut(id: string): void {
    ensureConfigExists();
    const config: PathConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

    config.shortcuts = config.shortcuts.filter(s => s.id !== id);

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function updatePathShortcut(id: string, name: string, pathValue: string): void {
    ensureConfigExists();
    const config: PathConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

    const shortcut = config.shortcuts.find(s => s.id === id);
    if (shortcut) {
        shortcut.name = name;
        shortcut.path = pathValue;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    }
}
