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
        return this.search(query, 'films');
    }

    async searchSeries(query: string): Promise<SearchResult> {
        return this.search(query, 'series');
    }

    private async search(query: string, category: 'films' | 'series'): Promise<SearchResult> {
        await this.initialize();

        try {
            console.log(`[ZT] Searching for ${category}: ${query}`);

            const results = await ZTP.search(category, query);

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
            console.log(`[ZT] Grouped ${results.length} results into ${groupedMovies.length} items`);

            // Fetch file sizes for ALL qualities of first 10 items
            const itemsToFetch = groupedMovies.slice(0, 10);
            console.log(`[ZT] Fetching file sizes for ${itemsToFetch.length} items...`);

            await Promise.all(
                itemsToFetch.flatMap((movie) =>
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

            // Check Plex for each item (only for movies for now, series logic is different)
            if (category === 'films') {
                await this.checkPlexStatus(groupedMovies);
            }

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

            // Look specifically for the "1fichier" label (not Rapidgator, Turbobit, etc.)
            // Then get the Télécharger links that come after it

            let found1fichier = false;
            let skipUntilNext1fichier = false;

            $('*').each((_, el) => {
                if (found1fichier && links.length >= 3) return; // Stop after 3 links

                const text = $(el).text().trim();

                // Reset if we hit another hosting service (means we passed 1fichier section)
                if (found1fichier && (text === 'Rapidgator' || text === 'Turbobit' || text === 'Nitroflare' ||
                    text === 'Uploady' || text === 'DailyUploads')) {
                    skipUntilNext1fichier = true;
                }

                // Look for exact "1fichier" text (not part of a longer string)
                if (!found1fichier && text === '1fichier') {
                    console.log(`[ZT] Found 1fichier label`);
                    found1fichier = true;
                    skipUntilNext1fichier = false;
                    return;
                }

                // After finding 1fichier and before hitting another service, collect Télécharger links
                if (found1fichier && !skipUntilNext1fichier && $(el).is('a')) {
                    const href = $(el).attr('href');
                    const linkText = $(el).text().trim();

                    if (href && href.includes('dl-protect.link') && linkText === 'Télécharger') {
                        console.log(`[ZT] Found 1fichier download link: ${href}`);
                        links.push(href);
                    }
                }
            });

            if (links.length > 0) {
                console.log(`[ZT] Found ${links.length} 1fichier download links`);
                return links;
            }

            // Fallback
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

    async getEpisodeLinks(detailPageUrl: string): Promise<{ episode: string; link: string }[]> {
        try {
            console.log(`[ZT] Fetching episode links from: ${detailPageUrl}`);

            const response = await axios.get(detailPageUrl);
            const $ = cheerio.load(response.data);

            const episodes: { episode: string; link: string }[] = [];
            const episodePattern = /Episode\s+(\d+)/i;

            // Find all links and track which hosting service they belong to
            let currentHosting: string | null = null;
            let in1fichierSection = false;

            $('*').each((_: number, el: any) => {
                const $el = $(el);
                const text = $el.text().trim();

                // Check if this is a hosting service heading
                if (text === '1fichier') {
                    console.log('[ZT] Found 1fichier section');
                    currentHosting = '1fichier';
                    in1fichierSection = true;
                    return;
                }

                // If we hit another hosting service, stop collecting
                if (in1fichierSection && (text === 'Rapidgator' || text === 'Turbobit' ||
                    text === 'Nitroflare' || text === 'Uploady' || text === 'DailyUploads')) {
                    console.log(`[ZT] Reached ${text} section, stopping`);
                    in1fichierSection = false;
                    return;
                }

                // Only collect links if we're in the 1fichier section
                if (in1fichierSection && $el.is('a')) {
                    const href = $el.attr('href');
                    const linkText = $el.text().trim();

                    if (href && href.includes('dl-protect.link') && episodePattern.test(linkText)) {
                        console.log(`[ZT] Found episode: "${linkText}" -> ${href}`);
                        episodes.push({
                            episode: linkText,
                            link: href
                        });
                    }
                }
            });

            console.log(`[ZT] Total episodes found in 1fichier section: ${episodes.length}`);
            return episodes;
        } catch (error: any) {
            console.error('[ZT] Failed to fetch episode links:', error.message);
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

            // Fetch Plex library sections to find the movie section
            const baseUrl = settings.plexUrl.replace(/\/$/, '');

            // 1. Get all sections
            const sectionsResponse = await axios.get(`${baseUrl}/library/sections`, {
                params: { 'X-Plex-Token': settings.plexToken },
                headers: { 'Accept': 'application/xml' },
                timeout: 5000
            });

            const $sections = cheerio.load(sectionsResponse.data, { xmlMode: true });

            // 2. Find the first section with type="movie"
            let movieSectionKey: string | null = null;
            $sections('Directory[type="movie"]').each((_, element) => {
                if (!movieSectionKey) {
                    movieSectionKey = $sections(element).attr('key') || null;
                    const title = $sections(element).attr('title');
                    console.log(`[ZT] Found Plex movie section: "${title}" (key: ${movieSectionKey})`);
                }
            });

            if (!movieSectionKey) {
                console.log('[ZT] No movie library found in Plex');
                return;
            }

            // 3. Fetch all movies from that section
            const response = await axios.get(`${baseUrl}/library/sections/${movieSectionKey}/all`, {
                params: { 'X-Plex-Token': settings.plexToken },
                headers: { 'Accept': 'application/xml' },
                timeout: 10000 // Increased timeout for large libraries
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
