import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { parentPath, folderName } = body;

        const response = await fetch(`${API_URL}/paths/create-folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({ path: parentPath, name: folderName })
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to create folder' }, { status: response.status });
        }

        // Swift returns .ok
        // Frontend expects { success: true, path: ... }
        // We can construct path manually or update Swift to return it.
        // For now, manual.
        const newPath = `${parentPath}/${folderName}`; // Simple join, might need better handling but sufficient for now.

        return NextResponse.json({
            success: true,
            path: newPath
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
