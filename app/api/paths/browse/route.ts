import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        const response = await fetch(`${API_URL}/paths/browse?path=${path}`, {
            headers: { 'Cookie': request.headers.get('cookie') || '' }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to browse path' }, { status: response.status });
        }

        const items = await response.json();
        // Swift returns [FileItem], Frontend expects { currentPath, folders: [] }
        // We need to adapt the response.

        const folders = items.map((item: any) => ({
            name: item.name,
            path: item.path
        }));

        return NextResponse.json({
            currentPath: path,
            folders
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
