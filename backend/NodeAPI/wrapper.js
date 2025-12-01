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

            // Search films, series, and mangas (pages 1-3)
            const pages = [1, 2, 3];
            const filmsPromises = pages.map(page => ztParser.search('films', query, page));
            const seriesPromises = pages.map(page => ztParser.search('series', query, page));
            const mangasPromises = pages.map(page => ztParser.search('mangas', query, page));

            const filmsResults = await Promise.all(filmsPromises);
            const seriesResults = await Promise.all(seriesPromises);
            const mangasResults = await Promise.all(mangasPromises);

            // Combine and format results
            const filmsList = filmsResults.flatMap(r => Array.isArray(r) ? r : []);
            const seriesList = seriesResults.flatMap(r => Array.isArray(r) ? r : []);
            const mangasList = mangasResults.flatMap(r => Array.isArray(r) ? r : []);

            // Log errors if any (but don't crash)
            filmsResults.forEach(r => { if (!Array.isArray(r) && r && r.error) console.error('Films search error:', r.error); });
            seriesResults.forEach(r => { if (!Array.isArray(r) && r && r.error) console.error('Series search error:', r.error); });
            mangasResults.forEach(r => { if (!Array.isArray(r) && r && r.error) console.error('Mangas search error:', r.error); });

            const results = [
                ...filmsList.map(item => ({ ...item, type: 'movie' })),
                ...seriesList.map(item => ({ ...item, type: 'series' })),
                ...mangasList.map(item => ({ ...item, type: 'series' })) // Treat mangas as series
            ].map(item => ({
                id: item.url.replace(BASE_URL, ''),
                title: item.title,
                type: item.type,
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

            const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
            const $ = await ztParser._getDOMElementFromURL(fullUrl);

            const links = [];


            // Based on user description: "1fichier" label -> "télécharger" button
            // Strategy: Find '1fichier' text, then look for the next 'a' tag with 'télécharger' or just the next link

            $('b').each((i, el) => {
                const text = $(el).text();
                if (text.toLowerCase().includes('1fichier')) {
                    // Check next sibling
                    let next = $(el).next();
                    if (next.is('br')) next = next.next();

                    // The link is likely inside a <b> tag, e.g. <b><a ...>Télécharger</a></b>
                    // So check if next is 'a' OR if it contains 'a'
                    let link = null;
                    if (next.is('a')) {
                        link = next;
                    } else {
                        link = next.find('a');
                    }

                    if (link && link.length > 0) {
                        const href = link.attr('href');
                        if (href) links.push(href);
                    } else {
                        // Try parent's next element
                        const parentNext = $(el).parent().next();
                        const parentLink = parentNext.find('a');
                        if (parentLink.length > 0) {
                            const href = parentLink.attr('href');
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
        else if (command === 'episodes') {
            const url = args[1];
            if (!url) throw new Error('URL argument missing');

            const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
            const $ = await ztParser._getDOMElementFromURL(fullUrl);

            const episodes = [];

            // Strategy: Look for links that look like episodes
            $('a').each((i, el) => {
                const text = $(el).text().trim();
                const href = $(el).attr('href');

                // Match "Episode X" or similar patterns
                // Also ensure it's a download link (dl-protect or similar)
                if (href && (href.includes('dl-protect') || href.includes('1fichier'))) {
                    if (text.match(/Episode\s+\d+/i) || text.match(/^E\d+/i)) {
                        episodes.push({
                            episode: text,
                            link: href
                        });
                    }
                }
            });

            console.log(JSON.stringify({ episodes: episodes }));
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
main();
