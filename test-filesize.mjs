// Test file size extraction
import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFileSize() {
    try {
        const testUrl = 'https://zone-telechargement.irish?p=film&id=12862-joker';
        console.log('Fetching:', testUrl);

        const response = await axios.get(testUrl);
        const $ = cheerio.load(response.data);

        const pageText = $.text();

        // Show first 2000 chars to see what's there
        console.log('\nPage text sample:');
        console.log(pageText.substring(0, 2000));

        // Try different patterns
        console.log('\n\nTrying different size patterns:');

        const patterns = [
            /(\d+\.?\d*)\s*(GB|MB|Go|Mo|TB|To)/gi,
            /Taille[:\s]+(\d+\.?\d*)\s*(GB|MB|Go|Mo)/gi,
            /Size[:\s]+(\d+\.?\d*)\s*(GB|MB)/gi,
        ];

        patterns.forEach((pattern, i) => {
            console.log(`\nPattern ${i + 1}:`, pattern);
            const matches = pageText.match(pattern);
            if (matches) {
                console.log('Matches:', matches.slice(0, 5));
            } else {
                console.log('No matches');
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testFileSize();
