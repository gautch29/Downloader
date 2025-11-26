import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Cookie': request.headers.get('cookie') || '' }
        });

        const response = NextResponse.json({ success: true });
        response.cookies.delete('session_id');
        return response;
    } catch (error) {
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}
