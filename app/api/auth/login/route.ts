import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.reason || 'Login failed' },
                { status: response.status }
            );
        }

        const nextResponse = NextResponse.json(data);

        // Forward Set-Cookie header
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            nextResponse.headers.set('Set-Cookie', setCookie);
        }

        return nextResponse;
    } catch (error: any) {
        console.error('[API] Login error:', error);
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}
