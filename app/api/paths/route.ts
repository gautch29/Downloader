import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPathShortcuts, addPathShortcut, deletePathShortcut } from '@/lib/path-config';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const paths = await getPathShortcuts();

        return NextResponse.json({ paths });
    } catch (error: any) {
        console.error('[API] Get paths error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch paths' },
            { status: 500 }
        );
    }
}

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
        const { name, path } = body;

        if (!name || !path) {
            return NextResponse.json(
                { error: 'Name and path are required' },
                { status: 400 }
            );
        }

        await addPathShortcut(name, path);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Add path error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add path' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        await deletePathShortcut(name);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Delete path error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete path' },
            { status: 500 }
        );
    }
}
