import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/movies/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch links' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
