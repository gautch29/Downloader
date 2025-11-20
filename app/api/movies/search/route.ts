import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ztClientEnhanced } from '@/lib/zt-client-enhanced';

export async function GET(request: NextRequest) {
    try {
        const userId = await getSession();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter "q" is required' },
                { status: 400 }
            );
        }

        const results = await ztClientEnhanced.searchMovies(query);

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('[API] Movie search error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search movies' },
            { status: 500 }
        );
    }
}
