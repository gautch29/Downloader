import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getDownloads } from '@/app/actions';
import { db } from '@/lib/db';
import { downloads } from '@/db/schema';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const downloadsList = await getDownloads();

        return NextResponse.json({ downloads: downloadsList });
    } catch (error: any) {
        console.error('[API] Get downloads error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch downloads' },
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
        const { url, customFilename, targetPath } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Add download to database
        const [download] = await db.insert(downloads).values({
            url,
            customFilename: customFilename || null,
            targetPath: targetPath || null,
            status: 'pending',
        }).returning();

        return NextResponse.json({
            success: true,
            download
        });
    } catch (error: any) {
        console.error('[API] Add download error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add download' },
            { status: 500 }
        );
    }
}
