import ZTP from 'zt-film-api';

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
            // Set the current ZT base URL
            // Note: This may need to be updated if ZT changes domains
            await ZTP.useBaseURL();
            this.initialized = true;
            console.log('[ZT] Client initialized successfully');
        } catch (error) {
            console.error('[ZT] Failed to initialize:', error);
            throw new Error('Failed to connect to Zone-Telechargement');
        }
    }

    async searchMovies(query: string): Promise<SearchResult> {
        await this.initialize();

        try {
            console.log(`[ZT] Searching for: ${query}`);

            // Search in films category
            const results = await ZTP.search('films', query);

            if (!results || !Array.isArray(results)) {
                return { movies: [], total: 0 };
            }

            // Transform results to our format
            const movies: MovieResult[] = results.map((result: any, index: number) => {
                // Extract 1fichier links from the result
                const links = this.extract1fichierLinks(result);

                return {
                    id: result.id || `movie-${index}`,
                    title: result.title || result.name || 'Unknown',
                    year: result.year || result.date,
                    quality: this.extractQuality(result.title || result.name),
                    language: this.extractLanguage(result.title || result.name),
                    poster: result.poster || result.image,
                    links
                };
            });

            // Filter out movies with no 1fichier links
            const validMovies = movies.filter(m => m.links.length > 0);

            console.log(`[ZT] Found ${validMovies.length} movies with download links`);

            return {
                movies: validMovies,
                total: validMovies.length
            };
        } catch (error: any) {
            console.error('[ZT] Search error:', error);
            throw new Error(`Search failed: ${error.message || 'Unknown error'}`);
        }
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
