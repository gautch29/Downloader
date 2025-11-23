// Test using the actual ZT client
import { ztClientEnhanced } from './lib/zt-client-enhanced.js';

async function test() {
    console.log('Searching for Pluribus...');
    const results = await ztClientEnhanced.searchSeries('pluribus');

    console.log(`Found ${results.movies.length} series`);

    if (results.movies.length > 0) {
        const series = results.movies[0];
        console.log('\nSeries:', series.title);
        console.log('Qualities:', series.qualities.length);

        if (series.qualities.length > 0) {
            const quality = series.qualities[0];
            console.log('\nTesting first quality:');
            console.log('Quality:', quality.quality);
            console.log('URL:', quality.url);

            console.log('\nFetching episodes...');
            const episodes = await ztClientEnhanced.getEpisodeLinks(quality.url);

            console.log(`Found ${episodes.length} episodes`);
            if (episodes.length > 0) {
                console.log('\nFirst 5 episodes:');
                episodes.slice(0, 5).forEach((ep, i) => {
                    console.log(`  ${i + 1}. ${ep.episode}`);
                });
            }
        }
    }
}

test().catch(console.error);
