const ztParser = require('./backend/NodeAPI/ztParser');

const BASE_URL = 'https://www.zone-telechargement.irish';
ztParser.useBaseURL(BASE_URL);

async function run() {
    try {
        // Example series URL (need to find a real one first)
        // Let's search for a series first
        console.log('Searching for series "fallout"...');
        const results = await ztParser.search('series', 'fallout', 1);

        if (results.length > 0) {
            const firstSeries = results[0];
            console.log('Found series:', firstSeries.title, firstSeries.url);

            // Now fetch the detail page
            const $ = await ztParser._getDOMElementFromURL(firstSeries.url);

            // Log relevant parts to find episodes
            // Usually episodes are links like "Episode 1", "Episode 2" etc.
            // Or inside a specific container.

            console.log('Page Title:', $('title').text());

            // Try to find links containing "Episode"
            $('a').each((i, el) => {
                const text = $(el).text();
                if (text.includes('Episode') || text.match(/E\d+/)) {
                    console.log('Potential Episode Link:', text.trim(), $(el).attr('href'));
                    console.log('Parent HTML:', $(el).parent().html());
                }
            });
        } else {
            console.log('No series found.');
        }
    } catch (e) {
        console.error(e);
    }
}

run();
