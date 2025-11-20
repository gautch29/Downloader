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
}

export interface GroupedMovie {
    id: string;
    title: string;
    cleanTitle: string; // Title without quality/language
    year?: string;
    poster?: string;
    qualities: MovieQuality[];
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

            // Group movies by clean title
            const movieMap = new Map<string, GroupedMovie>();

            for (const result of results) {
                const cleanTitle = this.extractCleanTitle(result.title);
                const year = this.extractYear(result.title);

                if (!movieMap.has(cleanTitle)) {
                    movieMap.set(cleanTitle, {
                        id: result.id,
                        title: cleanTitle,
                        cleanTitle,
                        year,
                        poster: result.image,
                        qualities: []
                    });
                }

                const movie = movieMap.get(cleanTitle)!;
                movie.qualities.push({
                    quality: result.quality || 'Unknown',
                    language: result.language || 'Unknown',
                    url: result.url,
                    links: [] // Will be fetched on-demand
                });
            }

            const groupedMovies = Array.from(movieMap.values());
            console.log(`[ZT] Grouped into ${groupedMovies.length} unique movies`);

            return {
                movies: groupedMovies,
                total: groupedMovies.length
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
