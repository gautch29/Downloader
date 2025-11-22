import { NextRequest, NextResponse } from 'next/server';
import { ztClientEnhanced } from '@/lib/zt-client-enhanced';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const results = await ztClientEnhanced.searchSeries(query);
        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Series search error:', error);
        return NextResponse.json({ error: 'Failed to search series' }, { status: 500 });
    }
}
