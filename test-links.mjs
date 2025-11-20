// Debug 1fichier link extraction
import axios from 'axios';
import * as cheerio from 'cheerio';

async function testLinkExtraction() {
    try {
        const testUrl = 'https://zone-telechargement.irish?p=film&id=12862-joker';
        console.log('Fetching:', testUrl);

        const response = await axios.get(testUrl);
        const $ = cheerio.load(response.data);

        console.log('\n=== Looking for 1fichier links ===\n');

        // Method 1: Find all links with 1fichier in href
        console.log('Method 1: Links with 1fichier in href');
        const links1 = [];
        $('a[href*="1fichier"]').each((_, element) => {
            const href = $(element).attr('href');
            console.log('  Found:', href);
            links1.push(href);
        });
        console.log(`  Total: ${links1.length}\n`);

        // Method 2: Find all links and filter
        console.log('Method 2: All links filtered');
        const links2 = [];
        $('a').each((_, element) => {
            const href = $(element).attr('href');
            if (href && (href.includes('1fichier.com') || href.includes('1fichier.net'))) {
                console.log('  Found:', href);
                links2.push(href);
            }
        });
        console.log(`  Total: ${links2.length}\n`);

        // Method 3: Search in text content
        console.log('Method 3: Regex in page text');
        const pageText = $.text();
        const urlRegex = /https?:\/\/(?:www\.)?1fichier\.(?:com|net)\/\?[a-zA-Z0-9]+/g;
        const matches = pageText.match(urlRegex);
        if (matches) {
            matches.forEach(match => console.log('  Found:', match));
            console.log(`  Total: ${matches.length}\n`);
        } else {
            console.log('  No matches\n');
        }

        // Method 4: Look for any URL patterns
        console.log('Method 4: All URLs in page');
        const allUrls = pageText.match(/https?:\/\/[^\s"'<>]+/g);
        if (allUrls) {
            const fichierUrls = allUrls.filter(url => url.includes('fichier'));
            console.log('  URLs with "fichier":');
            fichierUrls.forEach(url => console.log('    ', url));
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLinkExtraction();
