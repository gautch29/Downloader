// Test Plex detection for Joker
import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPlexDetection() {
    try {
        // You'll need to replace these with your actual values
        const plexUrl = 'YOUR_PLEX_URL'; // e.g., 'http://192.168.1.100:32400'
        const plexToken = 'YOUR_PLEX_TOKEN';

        console.log('Testing Plex detection for "Joker"...\n');
        console.log(`Plex URL: ${plexUrl}`);

        const baseUrl = plexUrl.replace(/\/$/, '');
        const response = await axios.get(`${baseUrl}/library/sections/all/all`, {
            params: { 'X-Plex-Token': plexToken },
            headers: { 'Accept': 'application/xml' },
            timeout: 5000
        });

        const $ = cheerio.load(response.data, { xmlMode: true });

        // Extract all movie titles
        const movies = [];
        $('Video[type="movie"]').each((_, element) => {
            const title = $(element).attr('title');
            if (title) {
                movies.push(title);
            }
        });

        console.log(`Found ${movies.length} movies in Plex library\n`);

        // Look for Joker
        const jokerMovies = movies.filter(m => m.toLowerCase().includes('joker'));
        console.log('Movies containing "joker":');
        jokerMovies.forEach(m => console.log(`  - "${m}"`));

        // Test normalization
        console.log('\n=== Testing normalization ===');
        const testTitle = 'Joker';
        const normalized = testTitle.toLowerCase().trim().replace(/[^\w\s]/g, '');
        console.log(`Original: "${testTitle}"`);
        console.log(`Normalized: "${normalized}"`);

        // Check if any Plex movies match
        const plexNormalized = movies.map(m => m.toLowerCase().trim().replace(/[^\w\s]/g, ''));
        const hasMatch = plexNormalized.includes(normalized);
        console.log(`\nMatch found: ${hasMatch}`);

    } catch (error) {
        console.error('Error:', error.message);
        console.log('\nMake sure to replace YOUR_PLEX_URL and YOUR_PLEX_TOKEN with actual values!');
    }
}

testPlexDetection();
