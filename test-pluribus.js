// Test script to verify episode scraping for Pluribus
const axios = require('axios');
const cheerio = require('cheerio');

async function testPluribusScraping() {
    // First, search for Pluribus to get the URL
    console.log('Searching for Pluribus...');
    const searchUrl = 'https://www.zone-telechargement.irish/index.php?do=search';

    const searchResponse = await axios.post(searchUrl,
        'do=search&subaction=search&story=pluribus',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        }
    );

    const $ = cheerio.load(searchResponse.data);

    // Find the first series link
    let seriesUrl = null;
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text();
        if (href && href.includes('?p=serie') && text.toLowerCase().includes('pluribus')) {
            seriesUrl = href;
            return false; // break
        }
    });

    if (!seriesUrl) {
        console.log('Could not find Pluribus series');
        return;
    }

    console.log('Found series URL:', seriesUrl);

    // Now fetch episodes from that URL
    console.log('\nFetching episodes...');
    const response = await axios.get(seriesUrl);
    const $page = cheerio.load(response.data);

    const episodes = [];
    const episodePattern = /Episode\s+(\d+)/i;
    let in1fichierSection = false;

    $page('*').each((_, el) => {
        const $el = $page(el);
        const text = $el.text().trim();

        if (text === '1fichier') {
            console.log('Found 1fichier section');
            in1fichierSection = true;
            return;
        }

        if (in1fichierSection && (text === 'Rapidgator' || text === 'Turbobit' ||
            text === 'Nitroflare' || text === 'Uploady' || text === 'DailyUploads')) {
            console.log(`Reached ${text} section, stopping`);
            in1fichierSection = false;
            return;
        }

        if (in1fichierSection && $el.is('a')) {
            const href = $el.attr('href');
            const linkText = $el.text().trim();

            if (href && href.includes('dl-protect.link') && episodePattern.test(linkText)) {
                console.log(`Found episode: "${linkText}"`);
                episodes.push({ episode: linkText, link: href });
            }
        }
    });

    console.log(`\nTotal episodes found: ${episodes.length}`);
    if (episodes.length > 0) {
        console.log('First 5 episodes:');
        episodes.slice(0, 5).forEach((ep, i) => {
            console.log(`  ${i + 1}. ${ep.episode}`);
        });
    }
}

testPluribusScraping().catch(console.error);
