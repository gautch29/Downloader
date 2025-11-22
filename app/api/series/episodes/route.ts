import { NextRequest, NextResponse } from 'next/server';
import { ztClientEnhanced } from '@/lib/zt-client-enhanced';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const episodes = await ztClientEnhanced.getEpisodeLinks(url);
        return NextResponse.json({ episodes });
    } catch (error: any) {
        console.error('Episode fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
    }
}
