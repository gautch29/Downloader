
import ZTP from 'zt-film-api';
import { getConfig } from '@/lib/config';

// Zone-Telechargement client wrapper
// Handles movie search and 1fichier link extraction

export interface MovieResult {
    id: string;
    title: string;
    year?: string;
    quality?: string;
    language?: string;
    poster?: string;
    links: string[]; // 1fichier URLs
}

export interface SearchResult {
    movies: MovieResult[];
    total: number;
}

class ZTClient {
    private initialized = false;

    async initialize() {
        if (this.initialized) return;

        try {
            const config = getConfig();
            const baseURL = config.services.zoneTelechargement.baseUrl;

            // Use the explicit URL approach that works in test script
            ZTP.useBaseURL(baseURL);
            this.initialized = true;
            console.log(`[ZT] Client initialized with URL: ${baseURL}`);
        } catch (error) {
            console.error('[ZT] Initialization warning:', error);
            // Continue anyway - search might still work
            this.initialized = true;
        }
    }


    async searchMovies(query: string): Promise<SearchResult> {
        await this.initialize();

        try {
            console.log(`[ZT] Searching for: ${query}`);

            // Search in films category
            const results = await ZTP.search('films', query);

            console.log(`[ZT] Raw results type: ${typeof results}, isArray: ${Array.isArray(results)}`);

            if (!results || !Array.isArray(results)) {
                console.log('[ZT] Invalid response format:', results);
                return { movies: [], total: 0 };
            }

            console.log(`[ZT] Found ${results.length} search results`);

            // Transform results to our format
            // Note: ZT API returns metadata only, actual download links require fetching detail pages
            const movies: MovieResult[] = results.map((result: any) => {
                return {
                    id: result.id || result.url || `movie-${Math.random()}`,
                    title: result.title || 'Unknown',
                    year: this.extractYear(result.title),
                    quality: result.quality || 'Unknown',
                    language: result.language || 'Unknown',
                    poster: result.image,
                    links: result.url ? [result.url] : [] // Store detail page URL for now
                };
            });

            // Filter out movies without URLs
            const validMovies = movies.filter(m => m.links.length > 0);

            console.log(`[ZT] Returning ${validMovies.length} movies`);

            return {
                movies: validMovies,
                total: validMovies.length
            };
        } catch (error: any) {
            console.error('[ZT] Search error:', error);
            throw new Error(`Search failed: ${error.message || 'Unknown error'}`);
        }
    }

    private extractYear(title: string): string | undefined {
        const yearMatch = title.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? yearMatch[0] : undefined;
    }

    private extract1fichierLinks(result: any): string[] {
        const links: string[] = [];

        // Check various possible fields where links might be stored
        const possibleFields = [
            result.links,
            result.downloadLinks,
            result.download,
            result.url,
            result.urls
        ];

        for (const field of possibleFields) {
            if (!field) continue;

            if (typeof field === 'string') {
                if (this.is1fichierLink(field)) {
                    links.push(field);
                }
            } else if (Array.isArray(field)) {
                for (const link of field) {
                    if (typeof link === 'string' && this.is1fichierLink(link)) {
                        links.push(link);
                    } else if (typeof link === 'object' && link.url && this.is1fichierLink(link.url)) {
                        links.push(link.url);
                    }
                }
            } else if (typeof field === 'object') {
                // Check if it's an object with URL properties
                for (const key in field) {
                    const value = field[key];
                    if (typeof value === 'string' && this.is1fichierLink(value)) {
                        links.push(value);
                    }
                }
            }
        }

        return [...new Set(links)]; // Remove duplicates
    }

    private is1fichierLink(url: string): boolean {
        return url.includes('1fichier.com') || url.includes('1fichier.net');
    }

    private extractQuality(title: string): string {
        const qualityMatch = title.match(/\b(4K|2160p|1080p|720p|480p|HDTV|WEB-DL|BluRay|BDRip|DVDRip)\b/i);
        return qualityMatch ? qualityMatch[1].toUpperCase() : 'Unknown';
    }

    private extractLanguage(title: string): string {
        if (title.match(/\bVF\b/i)) return 'VF';
        if (title.match(/\bVOSTFR\b/i)) return 'VOSTFR';
        if (title.match(/\bVO\b/i)) return 'VO';
        if (title.match(/\bMULTI\b/i)) return 'MULTI';
        return 'Unknown';
    }
}

// Export singleton instance
export const ztClient = new ZTClient();
