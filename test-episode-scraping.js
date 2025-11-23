// Quick test script to debug episode scraping
const axios = require('axios');
const cheerio = require('cheerio');

async function testEpisodeScraping() {
    const url = 'https://www.zone-telechargement.irish/?p=serie&id=24954-nouveau-jour-saison1';

    console.log('Fetching:', url);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    console.log('\n=== Looking for episode links ===\n');

    const episodePattern = /Episode\s+(\d+)/i;
    const episodes = [];

    // First pass: Look for direct links with episode text
    console.log('Pass 1: Looking for <a> tags with "Episode X" text...');
    $('a').each((_, el) => {
        const $link = $(el);
        const href = $link.attr('href');
        const text = $link.text().trim();

        if (href && href.includes('dl-protect.link') && episodePattern.test(text)) {
            console.log(`  Found: "${text}" -> ${href}`);
            episodes.push({ episode: text, link: href });
        }
    });

    console.log(`\nPass 1 result: ${episodes.length} episodes found`);

    // If no episodes found, try alternative approach
    if (episodes.length === 0) {
        console.log('\nPass 2: Looking for episode text near links...');

        $('*').each((_, el) => {
            const $el = $(el);
            const text = $el.text().trim();

            if (episodePattern.test(text) && text.length < 50) {
                console.log(`  Found episode text: "${text}"`);

                // Look for nearby link
                let $link = $el.find('a').first();
                if (!$link.length) $link = $el.next('a');
                if (!$link.length) $link = $el.parent().find('a').first();

                const href = $link.attr('href');
                if (href && href.includes('dl-protect.link')) {
                    console.log(`    -> Found link: ${href}`);
                    episodes.push({ episode: text, link: href });
                } else {
                    console.log(`    -> No valid link found`);
                }
            }
        });
    }

    console.log(`\n=== Final result: ${episodes.length} episodes ===`);
    episodes.forEach((ep, i) => {
        console.log(`${i + 1}. ${ep.episode}`);
    });
}

testEpisodeScraping().catch(console.error);
