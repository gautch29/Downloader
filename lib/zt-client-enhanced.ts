import ZTP from 'zt-film-api';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Enhanced ZT client with detail page scraping
// This is more complex than the basic client

export interface MovieQuality {
    quality: string;
    language: string;
    url: string; // Detail page URL
    links: string[]; // 1fichier links (fetched from detail page)
    fileSize?: string; // e.g., "1.5 GB"
}

export interface GroupedMovie {
    id: string;
    title: string;
    cleanTitle: string; // Title without quality/language
    year?: string;
    poster?: string;
    qualities: MovieQuality[];
    inPlex?: boolean; // Whether movie exists in Plex library
}

export interface SearchResult {
    movies: GroupedMovie[];
    total: number;
}

class ZTClientEnhanced {
    private initialized = false;
    private baseURL = 'https://zone-telechargement.irish';

    async initialize() {
        if (this.initialized) return;

        try {
            ZTP.useBaseURL(this.baseURL);
            this.initialized = true;
            console.log(`[ZT] Enhanced client initialized`);
        } catch (error) {
            console.error('[ZT] Initialization warning:', error);
            this.initialized = true;
        }
    }

    async searchMovies(query: string): Promise<SearchResult> {
        await this.initialize();

        try {
            console.log(`[ZT] Searching for: ${query}`);

            const results = await ZTP.search('films', query);

            if (!results || !Array.isArray(results)) {
                return { movies: [], total: 0 };
            }

            console.log(`[ZT] Found ${results.length} results`);

            // Don't group - ZT titles don't reliably include years
            // Each quality/language combo is shown as a separate item
            const movies: GroupedMovie[] = results.map((result) => {
                const cleanTitle = this.extractCleanTitle(result.title);
                const year = this.extractYear(result.title);

                return {
                    id: result.id,
                    title: result.title, // Keep full title with quality/language
                    cleanTitle,
                    year,
                    poster: result.image,
                    qualities: [{
                        quality: result.quality || 'Unknown',
                        language: result.language || 'Unknown',
                        url: result.url,
                        links: [],
                        fileSize: undefined
                    }],
                    inPlex: false
                };
            });

            console.log(`[ZT] Fetching file sizes for ${movies.length} movies...`);

            // Fetch file sizes in parallel (limit to first 10 to avoid overwhelming)
            const moviesToFetch = movies.slice(0, 10);
            await Promise.all(
                moviesToFetch.map(async (movie) => {
                    try {
                        const fileSize = await this.getFileSize(movie.qualities[0].url);
                        if (fileSize) {
                            movie.qualities[0].fileSize = fileSize;
                        }
                    } catch (error) {
                        // Silently fail for individual movies
                    }
                })
            );

            console.log(`[ZT] Returning ${movies.length} movies`);

            // Check Plex for each movie
            await this.checkPlexStatus(movies);

            return {
                movies,
                total: movies.length
            };
        } catch (error: any) {
            console.error('[ZT] Search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    async getDownloadLinks(detailPageUrl: string): Promise<string[]> {
        try {
            console.log(`[ZT] Fetching download links from: ${detailPageUrl}`);

            const response = await axios.get(detailPageUrl);
            const $ = cheerio.load(response.data);

            const links: string[] = [];

            // Look for 1fichier links in the page
            $('a[href*="1fichier"]').each((_, element) => {
                const href = $(element).attr('href');
                if (href && (href.includes('1fichier.com') || href.includes('1fichier.net'))) {
                    links.push(href);
                }
            });

            // Also check for links in text content
            const pageText = $.text();
            const urlRegex = /https?:\/\/(?:www\.)?1fichier\.(?:com|net)\/\?[a-zA-Z0-9]+/g;
            const matches = pageText.match(urlRegex);
            if (matches) {
                links.push(...matches);
            }

            // Remove duplicates
            const uniqueLinks = [...new Set(links)];

            console.log(`[ZT] Found ${uniqueLinks.length} 1fichier links`);
            return uniqueLinks;
        } catch (error: any) {
            console.error('[ZT] Failed to fetch download links:', error.message);
            return [];
        }
    }

    async getFileSize(detailPageUrl: string): Promise<string | undefined> {
        try {
            const response = await axios.get(detailPageUrl);
            const $ = cheerio.load(response.data);

            // Look for file size in common patterns
            const pageText = $.text();

            // Common patterns: "1.5 GB", "750 MB", "2.3Go", etc.
            const sizeMatch = pageText.match(/(\d+\.?\d*)\s*(GB|MB|Go|Mo|TB|To)/i);
            if (sizeMatch) {
                return `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}`;
            }

            return undefined;
        } catch (error) {
            return undefined;
        }
    }

    private async checkPlexStatus(movies: GroupedMovie[]): Promise<void> {
        try {
            const { getSettings } = await import('./settings');
            const settings = await getSettings();

            if (!settings?.plexUrl || !settings?.plexToken) {
                console.log('[ZT] Plex not configured, skipping check');
                return;
            }

            console.log('[ZT] Checking Plex library...');

            // Fetch Plex library
            const baseUrl = settings.plexUrl.replace(/\/$/, '');
            const response = await axios.get(`${baseUrl}/library/sections/all/all`, {
                params: { 'X-Plex-Token': settings.plexToken },
                headers: { 'Accept': 'application/xml' },
                timeout: 5000
            });

            const $ = cheerio.load(response.data, { xmlMode: true });

            // Extract all movie titles from Plex
            const plexTitles = new Set<string>();
            $('Video[type="movie"]').each((_, element) => {
                const title = $(element).attr('title');
                if (title) {
                    // Normalize title for comparison
                    const normalized = title.toLowerCase().trim().replace(/[^\w\s]/g, '');
                    plexTitles.add(normalized);
                }
            });

            console.log(`[ZT] Found ${plexTitles.size} movies in Plex library`);

            // Check each movie against Plex library
            for (const movie of movies) {
                // Normalize movie title for comparison
                const normalized = movie.cleanTitle.toLowerCase().trim().replace(/[^\w\s]/g, '');
                movie.inPlex = plexTitles.has(normalized);

                if (movie.inPlex) {
                    console.log(`[ZT] Found in Plex: ${movie.cleanTitle}`);
                }
            }

            const inPlexCount = movies.filter(m => m.inPlex).length;
            console.log(`[ZT] ${inPlexCount} of ${movies.length} movies found in Plex`);
        } catch (error: any) {
            console.error('[ZT] Failed to check Plex status:', error.message);
            // Silently fail - Plex check is optional
        }
    }

    private extractCleanTitle(title: string): string {
        // Remove quality, language, and other metadata from title
        return title
            .replace(/\b(HDLIGHT|BDRIP|WEBRIP|DVDRIP|4K|1080p|720p|480p)\b/gi, '')
            .replace(/\b(MULTI|TRUEFRENCH|FRENCH|VOSTFR|VO)\b/gi, '')
            .replace(/\(.*?\)/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private extractYear(title: string): string | undefined {
        const yearMatch = title.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? yearMatch[0] : undefined;
    }
}

export const ztClientEnhanced = new ZTClientEnhanced();
