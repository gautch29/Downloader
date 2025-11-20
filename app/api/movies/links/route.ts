import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ztClientEnhanced } from '@/lib/zt-client-enhanced';

export async function POST(request: NextRequest) {
    try {
        const userId = await getSession();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        const links = await ztClientEnhanced.getDownloadLinks(url);

        return NextResponse.json({ links });
    } catch (error: any) {
        console.error('[API] Get download links error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch download links' },
            { status: 500 }
        );
    }
}
