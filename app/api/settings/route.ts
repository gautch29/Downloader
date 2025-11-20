import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSettings, updateSettings } from '@/lib/settings';

export async function GET(request: NextRequest) {
    try {
        const userId = await getSession();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const settings = await getSettings();

        // Don't expose sensitive data like Plex token in full
        const safeSettings = {
            plexUrl: settings?.plexUrl || '',
            plexConfigured: !!(settings?.plexUrl && settings?.plexToken)
        };

        return NextResponse.json({ settings: safeSettings });
    } catch (error: any) {
        console.error('[API] Get settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userId = await getSession();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { plexUrl, plexToken } = body;

        await updateSettings(plexUrl, plexToken);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Update settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        );
    }
}
