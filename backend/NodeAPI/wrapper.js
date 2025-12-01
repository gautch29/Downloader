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
                size: item.size || '', // Include size
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

                    if (next.is('a')) {
                        const href = next.attr('href');
                        if (href) links.push(href);
                    } else {
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

