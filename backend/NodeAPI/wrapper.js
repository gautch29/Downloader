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

            if (!Array.isArray(films) && films?.error) console.error('Films search error:', films.error);
            if (!Array.isArray(series) && series?.error) console.error('Series search error:', series.error);

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
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && (href.includes('1fichier.com') || href.includes('dl-protect'))) {
                    links.push(href);
                }
            });

            console.log(JSON.stringify({ links: [...new Set(links)] }));
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
