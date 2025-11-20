import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPathShortcuts } from '@/lib/path-config';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const requestedPath = searchParams.get('path');

        if (!requestedPath) {
            return NextResponse.json(
                { error: 'Path is required' },
                { status: 400 }
            );
        }

        // Security check: Ensure the requested path is within one of the allowed root paths
        const shortcuts = await getPathShortcuts();
        const allowedRoots = shortcuts.map(s => s.path);

        // Normalize paths for comparison
        const normalizedRequested = path.resolve(requestedPath);

        const isAllowed = allowedRoots.some(root => {
            const normalizedRoot = path.resolve(root);
            return normalizedRequested.startsWith(normalizedRoot);
        });

        if (!isAllowed) {
            return NextResponse.json(
                { error: 'Access denied: Path is not within allowed shortcuts' },
                { status: 403 }
            );
        }

        // Check if directory exists
        if (!fs.existsSync(normalizedRequested)) {
            return NextResponse.json(
                { error: 'Directory not found' },
                { status: 404 }
            );
        }

        // Read directory contents
        const items = fs.readdirSync(normalizedRequested, { withFileTypes: true });

        const folders = items
            .filter(item => item.isDirectory() && !item.name.startsWith('.'))
            .map(item => ({
                name: item.name,
                path: path.join(normalizedRequested, item.name)
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
            currentPath: normalizedRequested,
            folders
        });

    } catch (error: any) {
        console.error('[API] Browse path error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to browse path' },
            { status: 500 }
        );
    }
}
