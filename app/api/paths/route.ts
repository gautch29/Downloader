import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/paths`, {
            headers: { 'Cookie': request.headers.get('cookie') || '' }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch paths' }, { status: response.status });
        }

        const data = await response.json();
        // Swift returns array directly, wrap it if needed or adjust frontend
        // Swift: [Path], Frontend expects { paths: [] }
        return NextResponse.json({ paths: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/paths`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to create path' }, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        const response = await fetch(`${API_URL}/paths?name=${name}`, {
            method: 'DELETE',
            headers: { 'Cookie': request.headers.get('cookie') || '' }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to delete path' }, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
