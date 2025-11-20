import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPlexMatching() {
    try {
        // Replace with your actual values
        const { getSettings } = await import('./lib/settings');
        // We can't import settings easily in a standalone script without ts-node
        // So we'll ask user to hardcode or read from env if possible.
        // For now, let's use the same hardcoded values as before or ask user to fill them.

        const plexUrl = 'http://192.168.1.24:32400'; // Based on previous logs
        const plexToken = 'YOUR_PLEX_TOKEN'; // User needs to fill this

        console.log('Testing Plex matching for Avengers...\n');

        const baseUrl = plexUrl.replace(/\/$/, '');

        // 1. Get library sections
        console.log('Fetching library sections...');
        const sectionsResponse = await axios.get(`${baseUrl}/library/sections`, {
            params: { 'X-Plex-Token': plexToken },
            headers: { 'Accept': 'application/xml' },
            timeout: 5000
        });

        const $sections = cheerio.load(sectionsResponse.data, { xmlMode: true });
        let movieSectionKey = null;
        $sections('Directory[type="movie"]').each((_, element) => {
            if (!movieSectionKey) movieSectionKey = $sections(element).attr('key');
        });

        if (!movieSectionKey) {
            console.log('No movie library found!');
            return;
        }

        // 2. Get all movies
        console.log(`Fetching movies from section ${movieSectionKey}...`);
        const response = await axios.get(`${baseUrl}/library/sections/${movieSectionKey}/all`, {
            params: { 'X-Plex-Token': plexToken },
            headers: { 'Accept': 'application/xml' },
            timeout: 10000
        });

        const $ = cheerio.load(response.data, { xmlMode: true });
        const movies = [];
        $('Video[type="movie"]').each((_, element) => {
            movies.push($(element).attr('title'));
        });

        console.log(`Found ${movies.length} movies in Plex.\n`);

        // 3. Analyze "Avengers" titles
        const avengers = movies.filter(m => m.toLowerCase().includes('avenger'));
        console.log('=== Avengers movies in Plex ===');
        avengers.forEach(m => console.log(`"${m}"`));

        // 4. Test Normalization Function
        function normalize(title) {
            return title
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/[^a-z0-9]/g, "") // Remove EVERYTHING except alphanumeric
                .trim();
        }

        console.log('\n=== Testing Normalization ===');
        const testCases = [
            "Avengers: Infinity War",
            "Avengers : Infinity War",
            "Avengers - Infinity War",
            "Avengers: L'ère d'Ultron",
            "Avengers L'ere d'Ultron",
            "Avengers Age of Ultron"
        ];

        testCases.forEach(testTitle => {
            const normalizedInput = normalize(testTitle);
            const match = avengers.find(plexTitle => normalize(plexTitle) === normalizedInput);
            console.log(`\nInput: "${testTitle}"`);
            console.log(`Normalized: "${normalizedInput}"`);
            if (match) {
                console.log(`✅ MATCHED with Plex: "${match}"`);
            } else {
                console.log(`❌ NO MATCH in Plex`);
                // Show close matches?
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response && error.response.status === 401) {
            console.log('Please update the Plex Token in the script!');
        }
    }
}

testPlexMatching();
