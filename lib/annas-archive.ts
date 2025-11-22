import axios from 'axios';
import * as cheerio from 'cheerio';

export interface BookResult {
    id: string;
    title: string;
    author: string;
    publisher?: string;
    year?: string;
    language?: string;
    extension?: string;
    size?: string;
    cover?: string;
    link?: string; // Detail page link
}

export class AnnasArchiveClient {
    private baseURL = 'https://annas-archive.org';

    async search(query: string): Promise<BookResult[]> {
        try {
            console.log(`[Annas] Searching for: ${query}`);

            // Use a realistic user agent to avoid immediate blocking
            const response = await axios.get(`${this.baseURL}/search`, {
                params: { q: query },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const books: BookResult[] = [];

            // Anna's Archive search results structure is a bit complex and changes.
            // We look for the main list items.
            // Based on current structure (approximate):
            // div.h-[125] is often used for the row container

            $('a.js-vim-focus').each((_, element) => {
                try {
                    const link = $(element).attr('href');
                    if (!link || !link.startsWith('/md5/')) return;

                    const $el = $(element);

                    // Extract cover
                    const cover = $el.find('img').attr('src');

                    // Extract text content
                    const text = $el.text();

                    // Title is usually in an h3 or bold text
                    const title = $el.find('h3').text().trim() || 'Unknown Title';

                    // Author, Publisher, Year etc are in divs
                    // This is heuristic as the structure is tailwind-heavy and classless
                    const author = $el.find('div.italic').first().text().trim() || 'Unknown Author';

                    // Metadata (Language, Ext, Size) often in a specific div
                    const metadata = $el.find('div.text-xs').text();

                    books.push({
                        id: link.replace('/md5/', ''),
                        title: title,
                        author: author,
                        cover: cover,
                        link: `${this.baseURL}${link}`,
                        // We'll parse more if needed, but this is a start
                    });
                } catch (e) {
                    // Skip malformed rows
                }
            });

            // If the above selector fails (structure changed), try a more generic approach
            if (books.length === 0) {
                console.log('[Annas] No results with primary selector, trying fallback...');
                // Fallback logic would go here
            }

            console.log(`[Annas] Found ${books.length} books`);
            return books;

        } catch (error: any) {
            console.error('[Annas] Search error:', error.message);
            throw new Error(`Failed to search Anna's Archive: ${error.message}`);
        }
    }
}

export const annasArchive = new AnnasArchiveClient();
