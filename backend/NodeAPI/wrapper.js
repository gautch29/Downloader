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

            const results = [
                ...filmsList.map(item => ({ ...item, type: 'movie' })),
                ...seriesList.map(item => ({ ...item, type: 'series' }))
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
            // Strategy: Find the "1fichier" header and extract links until the next header
            let oneFichierFound = false;

            // Try to find 1fichier specific section first
            $('b').each((i, el) => {
                const text = $(el).text().trim().toLowerCase();
                if (text.includes('1fichier')) {
                    oneFichierFound = true;

                    // Iterate through next siblings until we hit another bold tag (likely another host)
                    let next = $(el).parent().next(); // Usually the structure is <b><div>1fichier</div></b> then <br> then links

                    // If the structure is different (e.g. <b>1fichier</b> directly), adjust
                    if (!next.length) {
                        next = $(el).next();
                    }

                    while (next.length) {
                        // If we hit another host header (usually in <b>), stop
                        if (next.is('b') || next.find('b').length > 0) {
                            // Check if it's just a bold episode title or a host
                            // Hosts are usually simple text like "Uptobox"
                            // But sometimes "Episode 1" is bold too.
                            // Heuristic: Hosts are usually short words, Episodes contain "Episode"
                            const nextText = next.text().trim();
                            if (!nextText.includes('Episode') && !nextText.match(/^E\d+/)) {
                                break;
                            }
                        }

                        // Check for links in this element
                        const links = next.is('a') ? next : next.find('a');
                        links.each((j, linkEl) => {
                            const linkText = $(linkEl).text().trim();
                            const href = $(linkEl).attr('href');

                            if (href && (href.includes('dl-protect') || href.includes('1fichier'))) {
                                if (linkText.match(/Episode\s+\d+/i) || linkText.match(/^E\d+/i)) {
                                    episodes.push({
                                        episode: linkText,
                                        link: href
                                    });
                                }
                            }
                        });

                        next = next.next();
                    }
                }
            });

            // Fallback: if 1fichier section not found, or no episodes found in it, try generic search but filter for 1fichier if possible
            if (episodes.length === 0) {
                $('a').each((i, el) => {
                    const text = $(el).text().trim();
                    const href = $(el).attr('href');

                    if (href && (href.includes('dl-protect') || href.includes('1fichier'))) {
                        if (text.match(/Episode\s+\d+/i) || text.match(/^E\d+/i)) {
                            episodes.push({
                                episode: text,
                                link: href
                            });
                        }
                    }
                });
            }

            console.log(JSON.stringify({ episodes: episodes }));
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
main();
