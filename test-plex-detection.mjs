// Test Plex detection for Joker
import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPlexDetection() {
    try {
        // You'll need to replace these with your actual values
        const plexUrl = 'http://192.168.1.24:32400';
        const plexToken = 'YOUR_PLEX_TOKEN';

        console.log('Testing Plex detection for "Joker"...\n');
        console.log(`Plex URL: ${plexUrl}`);

        const baseUrl = plexUrl.replace(/\/$/, '');

        // First, get library sections
        console.log('Fetching library sections...');
        const sectionsResponse = await axios.get(`${baseUrl}/library/sections`, {
            params: { 'X-Plex-Token': plexToken },
            headers: { 'Accept': 'application/xml' },
            timeout: 5000
        });

        const $sections = cheerio.load(sectionsResponse.data, { xmlMode: true });

        // Find movie library section
        let movieSectionKey = null;
        $sections('Directory[type="movie"]').each((_, element) => {
            const title = $sections(element).attr('title');
            const key = $sections(element).attr('key');
            console.log(`Found movie library: "${title}" (key: ${key})`);
            if (!movieSectionKey) movieSectionKey = key;
        });

        if (!movieSectionKey) {
            console.log('\nNo movie library found!');
            return;
        }

        // Now get all movies from that section
        console.log(`\nFetching movies from section ${movieSectionKey}...`);
        const response = await axios.get(`${baseUrl}/library/sections/${movieSectionKey}/all`, {
            params: { 'X-Plex-Token': plexToken },
            headers: { 'Accept': 'application/xml' },
            timeout: 10000
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
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('URL:', error.config.url);
        }
        console.log('\nMake sure your Plex token is correct!');
    }
}

testPlexDetection();
