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

            // Group by clean title (works well for most cases)
            const movieMap = new Map<string, GroupedMovie>();

            for (const result of results) {
                const cleanTitle = this.extractCleanTitle(result.title);
                const year = this.extractYear(result.title);

                // Use clean title as grouping key
                const groupKey = cleanTitle;

                if (!movieMap.has(groupKey)) {
                    movieMap.set(groupKey, {
                        id: result.id,
                        title: cleanTitle,
                        cleanTitle,
                        year,
                        poster: result.image,
                        qualities: [],
                        inPlex: false
                    });
                }

                const movie = movieMap.get(groupKey)!;
                movie.qualities.push({
                    quality: result.quality || 'Unknown',
                    language: result.language || 'Unknown',
                    url: result.url,
                    links: [],
                    fileSize: undefined
                });
            }

            const groupedMovies = Array.from(movieMap.values());
            console.log(`[ZT] Grouped ${results.length} results into ${groupedMovies.length} movies`);

            // Fetch file sizes for ALL qualities of first 10 movies
            const moviesToFetch = groupedMovies.slice(0, 10);
            console.log(`[ZT] Fetching file sizes for ${moviesToFetch.length} movies...`);

            await Promise.all(
                moviesToFetch.flatMap((movie) =>
                    movie.qualities.map(async (quality) => {
                        try {
                            const fileSize = await this.getFileSize(quality.url);
                            if (fileSize) {
                                quality.fileSize = fileSize;
                            }
                        } catch (error) {
                            // Silently fail for individual qualities
                        }
                    })
                )
            );

            // Check Plex for each movie
            await this.checkPlexStatus(groupedMovies);

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

            // Simple approach: Find "1fichier" text, then find the next "Télécharger" link
            // This is the most reliable way given the varying page structures

            let found1fichier = false;

            // Get all text nodes and links in order
            $('*').each((_, el) => {
                if (found1fichier && links.length >= 3) return; // Stop after finding 3 links

                const text = $(el).text().trim();

                // Look for "1fichier" label (exact match or contains)
                if (!found1fichier && (text === '1fichier' || (text.includes('1fichier') && text.length < 50))) {
                    console.log(`[ZT] Found 1fichier label`);
                    found1fichier = true;
                    return; // Continue to next elements
                }

                // After finding 1fichier, look for "Télécharger" links
                if (found1fichier && $(el).is('a')) {
                    const href = $(el).attr('href');
                    const linkText = $(el).text().trim();

                    if (href && href.includes('dl-protect.link') && linkText === 'Télécharger') {
                        console.log(`[ZT] Found 1fichier download link: ${href}`);
                        links.push(href);
                    }
                }
            });

            // If we found links after 1fichier, return them
            if (links.length > 0) {
                console.log(`[ZT] Found ${links.length} 1fichier download links`);
                return links;
            }

            // Fallback: get all dl-protect links
            console.log('[ZT] No 1fichier section found, using fallback');
            $('a[href*="dl-protect.link"]').each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    links.push(href);
                }
            });

            const uniqueLinks = [...new Set(links)];
            console.log(`[ZT] Found ${uniqueLinks.length} download links (fallback)`);
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

            // Match file sizes with word boundaries and proper spacing
            // Avoid matching things like "9tB" in JavaScript
            const sizeMatch = pageText.match(/\b(\d+\.?\d*)\s+(GB|Go|MB|Mo|TB|To)\b/i);
            if (sizeMatch) {
                const size = parseFloat(sizeMatch[1]);
                const unit = sizeMatch[2].toUpperCase().replace('O', 'B'); // Normalize Go -> GB

                // Sanity check: reject unrealistic sizes
                if (unit.includes('TB') && size > 20) return undefined; // > 20TB is suspicious
                if (unit.includes('GB') && size > 50) return undefined; // > 50GB is suspicious for a single movie

                return `${sizeMatch[1]} ${unit}`;
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
