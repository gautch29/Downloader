const ztParser = require('./ztParser');

// Configure the parser
const BASE_URL = 'https://www.zone-telechargement.irish';
ztParser.useBaseURL(BASE_URL);

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        if (command === 'search') {
            const query = args[1];
            if (!query) throw new Error('Query argument missing');

            // Search both films and series
            const films = await ztParser.search('films', query, 1);
            const series = await ztParser.search('series', query, 1);

            // Combine and format results
            const filmsList = Array.isArray(films) ? films : [];
            const seriesList = Array.isArray(series) ? series : [];

            if (!Array.isArray(films) && films && films.error) console.error('Films search error:', films.error);
            if (!Array.isArray(series) && series && series.error) console.error('Series search error:', series.error);

            const results = [...filmsList, ...seriesList].map(item => ({
                id: item.url.replace(BASE_URL, ''),
                title: item.title,
                quality: item.quality || 'Unknown',
                language: item.language || 'Unknown',
                poster: item.image,
                links: [item.url]
            }));

            console.log(JSON.stringify({ movies: results, total: results.length }));
        }
        else if (command === 'links') {
            const url = args[1];
            if (!url) throw new Error('URL argument missing');

            // For links, we might need to parse the detail page.
            // ztParser has getQueryDatas but it requires TMDB key and does a lot of extra work.
            // We just want the links.
            // Let's use the internal method _getDOMElementFromURL to scrape links if needed,
            // OR just rely on the fact that the 'id' we passed IS the URL.

            // Actually, ztParser doesn't expose a simple "get links" method without TMDB.
            // But we can use the parser's internal helper if we want, or just implement a simple link extractor here
            // reusing the axios/cheerio from the library.

            // Let's try to use ztParser._getDOMElementFromURL if possible, but it's "private" (underscore).
            // However, in JS nothing is truly private.

            const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
            const $ = await ztParser._getDOMElementFromURL(fullUrl);

            const links = [];

            // Based on user description: "1fichier" label -> "télécharger" button
            // Let's look for the specific structure

            // Strategy: Find '1fichier' text, then look for the next 'a' tag with 'télécharger' or just the next link

            $('b').each((i, el) => {
                const text = $(el).text();
                if (text.toLowerCase().includes('1fichier')) {
                    // The user says "right under". It might be in the next sibling or parent's next sibling.
                    // Let's try to find the link in the vicinity.

                    // Check next sibling
                    let next = $(el).next();
                    if (next.is('br')) next = next.next();

                    if (next.is('a')) {
                        const href = next.attr('href');
                        if (href) links.push(href);
                    } else {
                        // Maybe it's in the parent's next sibling?

                        // Try parent's next element
                        const parentNext = $(el).parent().next();
                        const link = parentNext.find('a');
                        if (link.length > 0) {
                            const href = link.attr('href');
                            if (href) links.push(href);
                        }
                    }
                }
            });

            // Fallback: if specific logic fails, keep existing but filter better?
            if (links.length === 0) {
                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    const text = $(el).text().toLowerCase();
                    if (href && (href.includes('1fichier.com') || href.includes('dl-protect'))) {
                        // Only add if text implies download or it's a direct link
                        if (text.includes('télécharger') || text.includes('telecharger') || text.includes('download')) {
                            links.push(href);
                        }
                    }
                });
            }

            console.log(JSON.stringify({ links: [...new Set(links)] }));
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
