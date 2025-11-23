// Debug script to test Joker search
import ZTP from 'zt-film-api';

async function debugJokerSearch() {
    console.log('Testing Joker search to debug grouping...\n');

    try {
        ZTP.useBaseURL('https://zone-telechargement.irish');

        const results = await ZTP.search('films', 'Joker');

        console.log(`Found ${results.length} results\n`);

        // Show first 10 results with their titles and years
        results.slice(0, 10).forEach((result, i) => {
            console.log(`${i + 1}. ${result.title}`);
            console.log(`   Quality: ${result.quality}`);
            console.log(`   Language: ${result.language}`);
            console.log(`   ID: ${result.id}`);

            // Try to extract year
            const yearMatch = result.title.match(/\b(19|20)\d{2}\b/);
            console.log(`   Extracted year: ${yearMatch ? yearMatch[0] : 'None'}`);

            // Try to extract clean title
            const cleanTitle = result.title
                .replace(/\b(HDLIGHT|BDRIP|WEBRIP|DVDRIP|4K|1080p|720p|480p)\b/gi, '')
                .replace(/\b(MULTI|TRUEFRENCH|FRENCH|VOSTFR|VO)\b/gi, '')
                .replace(/\(.*?\)/g, '')
                .replace(/\[.*?\]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            console.log(`   Clean title: "${cleanTitle}"`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugJokerSearch();
