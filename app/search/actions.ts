'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_URL = 'http://localhost:8080/api';

export async function searchMoviesAction(query: string) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        const response = await fetch(`${API_URL}/movies/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Cookie': `session_id=${sessionId}` }
        });

        if (!response.ok) {
            return { error: 'Failed to search movies' };
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        return { error: error.message || 'Failed to search movies' };
    }
}

export async function getDownloadLinksAction(detailPageUrl: string) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        const response = await fetch(`${API_URL}/movies/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${sessionId}`
            },
            body: JSON.stringify({ url: detailPageUrl })
        });

        if (!response.ok) {
            return { error: 'Failed to fetch links' };
        }

        const data = await response.json();
        if (data.links.length === 0) {
            return { error: 'No 1fichier links found' };
        }
        return { links: data.links };
    } catch (error: any) {
        return { error: error.message || 'Failed to fetch download links' };
    }
}

export async function add1fichierDownloadAction(url: string, customFilename?: string, targetPath?: string) {
    // This action seems to just call addDownloadAction which is already updated or needs to be.
    // Wait, addDownloadAction is in app/actions.ts? Or app/downloads/actions.ts?
    // The previous code imported from '@/app/actions'.

    // Let's check if we can just call the API directly here or reuse existing action.
    // I'll call the API directly to be safe and self-contained.

    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        const response = await fetch(`${API_URL}/downloads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session_id=${sessionId}`
            },
            body: JSON.stringify({ url, customFilename, targetPath })
        });

        if (!response.ok) {
            return { error: 'Failed to add download' };
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to add download' };
    }
}
