const axios = require('axios');
const cheerio = require('cheerio');

async function testPluribusScraping() {
    // Use the URL from one of the Pluribus results
    // Based on the search, let's try the first quality URL
    const url = 'https://www.zone-telechargement.irish/?p=serie&id=24954-pluribus-saison1';

    console.log('Fetching:', url);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const episodes = [];
    const episodePattern = /Episode\s+(\d+)/i;
    let in1fichierSection = false;

    $('*').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();

        if (text === '1fichier') {
            console.log('✓ Found 1fichier section');
            in1fichierSection = true;
            return;
        }

        if (in1fichierSection && (text === 'Rapidgator' || text === 'Turbobit' ||
            text === 'Nitroflare' || text === 'Uploady' || text === 'DailyUploads')) {
            console.log(`✓ Reached ${text} section, stopping`);
            in1fichierSection = false;
            return;
        }

        if (in1fichierSection && $el.is('a')) {
            const href = $el.attr('href');
            const linkText = $el.text().trim();

            if (href && href.includes('dl-protect.link') && episodePattern.test(linkText)) {
                episodes.push({ episode: linkText, link: href });
            }
        }
    });

    console.log(`\n✓ Total episodes found: ${episodes.length}`);
    if (episodes.length > 0) {
        console.log('\nFirst 10 episodes:');
        episodes.slice(0, 10).forEach((ep, i) => {
            console.log(`  ${i + 1}. ${ep.episode}`);
        });
    } else {
        console.log('\n✗ NO EPISODES FOUND - Debugging...');

        // Check if 1fichier section exists at all
        let found1fichier = false;
        $('*').each((_, el) => {
            if ($(el).text().trim() === '1fichier') {
                found1fichier = true;
                return false;
            }
        });
        console.log('1fichier section exists:', found1fichier);

        // Check how many episode links exist in total
        let totalEpisodeLinks = 0;
        $('a').each((_, el) => {
            const text = $(el).text().trim();
            if (episodePattern.test(text)) {
                totalEpisodeLinks++;
            }
        });
        console.log('Total episode links on page:', totalEpisodeLinks);
    }
}

testPluribusScraping().catch(console.error);
