import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPathShortcuts } from '@/lib/path-config';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { parentPath, folderName } = body;

        if (!parentPath || !folderName) {
            return NextResponse.json(
                { error: 'Parent path and folder name are required' },
                { status: 400 }
            );
        }

        // Validate folder name (basic security)
        if (folderName.includes('/') || folderName.includes('\\') || folderName.includes('..')) {
            return NextResponse.json(
                { error: 'Invalid folder name' },
                { status: 400 }
            );
        }

        // Security check: Ensure the parent path is within one of the allowed root paths
        const shortcuts = await getPathShortcuts();
        const allowedRoots = shortcuts.map(s => s.path);

        // Normalize paths for comparison
        const normalizedParent = path.resolve(parentPath);

        const isAllowed = allowedRoots.some(root => {
            const normalizedRoot = path.resolve(root);
            return normalizedParent.startsWith(normalizedRoot);
        });

        if (!isAllowed) {
            return NextResponse.json(
                { error: 'Access denied: Path is not within allowed shortcuts' },
                { status: 403 }
            );
        }

        const newFolderPath = path.join(normalizedParent, folderName);

        // Check if folder already exists
        if (fs.existsSync(newFolderPath)) {
            return NextResponse.json(
                { error: 'Folder already exists' },
                { status: 409 }
            );
        }

        // Create directory
        fs.mkdirSync(newFolderPath, { recursive: true });

        return NextResponse.json({
            success: true,
            path: newFolderPath
        });

    } catch (error: any) {
        console.error('[API] Create folder error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create folder' },
            { status: 500 }
        );
    }
}
