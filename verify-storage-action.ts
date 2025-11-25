
import { getStorageInfoAction } from './app/settings/actions';
import { getSession } from './lib/session';

// Mock getSession to return a user ID
jest.mock('./lib/session', () => ({
    getSession: jest.fn().mockResolvedValue('test-user-id'),
}));

// Mock fs.statfs
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    statfs: (path, callback) => {
        callback(null, {
            blocks: 1000,
            bsize: 4096,
            bfree: 500,
            bavail: 500,
        });
    },
}));

// Mock path-config
jest.mock('./lib/path-config', () => ({
    getPathShortcuts: () => [
        { name: 'Movies', path: '/mnt/media/Movies' },
        { name: 'TV', path: '/mnt/media/TV' },
    ],
}));

async function run() {
    try {
        const info = await getStorageInfoAction();
        console.log('Storage Info:', JSON.stringify(info, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
