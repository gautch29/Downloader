import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/downloads`, {
            headers: { 'Cookie': request.headers.get('cookie') || '' }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch downloads' }, { status: response.status });
        }

        const data = await response.json();
        // Swift returns array, frontend expects { downloads: [] }
        return NextResponse.json({ downloads: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/downloads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to add download' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ success: true, download: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
