import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${API_URL}/settings`, {
            headers: { 'Cookie': request.headers.get('cookie') || '' }
        });

        if (!response.ok) {
            // If 401, return unauthorized
            if (response.status === 401) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            // If 404 (no settings yet), return default
            if (response.status === 404) {
                return NextResponse.json({ settings: { plexUrl: '', plexConfigured: false } });
            }
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: response.status });
        }

        const data = await response.json();
        // Swift returns Setting object directly. 
        // We want to mask token.
        // Swift Setting: { id, plexUrl, plexToken, updatedAt }

        const safeSettings = {
            plexUrl: data.plexUrl || '',
            plexConfigured: !!(data.plexUrl && data.plexToken)
        };

        return NextResponse.json({ settings: safeSettings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to update settings' }, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
