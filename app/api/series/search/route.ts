import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const response = await fetch(`${API_URL}/movies/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Cookie': request.headers.get('cookie') || '' }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to search series' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
