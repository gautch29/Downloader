'use server';

import { ztClientEnhanced, type SearchResult } from '@/lib/zt-client-enhanced';
import { revalidatePath } from 'next/cache';

export async function searchMoviesAction(query: string): Promise<SearchResult | { error: string }> {
    try {
        if (!query || query.trim().length < 2) {
            return { error: 'Search query must be at least 2 characters' };
        }

        const results = await ztClientEnhanced.searchMovies(query.trim());
        return results;
    } catch (error: any) {
        console.error('[searchMoviesAction] Error:', error);
        return { error: error.message || 'Failed to search movies' };
    }
}

export async function getDownloadLinksAction(detailPageUrl: string): Promise<{ links?: string[]; error?: string }> {
    try {
        const links = await ztClientEnhanced.getDownloadLinks(detailPageUrl);

        if (links.length === 0) {
            return { error: 'No 1fichier links found on this page' };
        }

        return { links };
    } catch (error: any) {
        console.error('[getDownloadLinksAction] Error:', error);
        return { error: error.message || 'Failed to fetch download links' };
    }
}

export async function add1fichierDownloadAction(url: string, customFilename?: string, targetPath?: string): Promise<{ success?: boolean; error?: string }> {
    try {
        // Import the existing addDownload action
        const { addDownload } = await import('@/app/actions');

        // Create FormData to match the existing API
        const formData = new FormData();
        formData.append('url', url);
        if (customFilename) formData.append('customFilename', customFilename);
        if (targetPath) formData.append('targetPath', targetPath);

        await addDownload(formData);

        // Revalidate the home page to show new download
        revalidatePath('/');

        return { success: true };
    } catch (error: any) {
        console.error('[add1fichierDownloadAction] Error:', error);
        return { error: error.message || 'Failed to add download' };
    }
}
