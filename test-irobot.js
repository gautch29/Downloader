const axios = require('axios');
const cheerio = require('cheerio');

async function testIRobotLinks() {
    // First search for "i robot"
    console.log('Searching for "irobot"...');
    const searchUrl = 'https://www.zone-telechargement.irish/index.php?do=search';

    const searchResponse = await axios.post(searchUrl,
        'do=search&subaction=search&story=irobot',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        }
    );

    const $ = cheerio.load(searchResponse.data);

    // Find the first movie link
    let movieUrl = null;
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text();
        if (href && href.includes('?p=film') && text.toLowerCase().includes('robot')) {
            movieUrl = href;
            console.log('Found movie URL:', movieUrl);
            return false; // break
        }
    });

    if (!movieUrl) {
        console.log('Could not find i robot movie');
        return;
    }

    // Now fetch the detail page
    console.log('\nFetching movie detail page...');
    const response = await axios.get(movieUrl);
    const $page = cheerio.load(response.data);

    console.log('\n=== Looking for 1fichier section ===');

    // Check if 1fichier exists
    let found1fichier = false;
    $page('*').each((_, el) => {
        const text = $page(el).text().trim();
        if (text === '1fichier') {
            found1fichier = true;
            console.log('✓ Found 1fichier section');
            return false;
        }
    });

    if (!found1fichier) {
        console.log('✗ No 1fichier section found');
    }

    console.log('\n=== All dl-protect links on page ===');
    const allLinks = [];
    $page('a[href*="dl-protect.link"]').each((_, el) => {
        const href = $page(el).attr('href');
        const text = $page(el).text().trim();
        allLinks.push({ text, href });
        console.log(`Link text: "${text}"`);
    });

    console.log(`\nTotal dl-protect links: ${allLinks.length}`);

    console.log('\n=== Looking for 1fichier + Télécharger pattern ===');
    let in1fichier = false;
    const telechargerLinks = [];

    $page('*').each((_, el) => {
        const $el = $page(el);
        const text = $el.text().trim();

        if (text === '1fichier') {
            in1fichier = true;
            return;
        }

        if (in1fichier && (text === 'Rapidgator' || text === 'Turbobit')) {
            in1fichier = false;
            return;
        }

        if (in1fichier && $el.is('a')) {
            const href = $el.attr('href');
            const linkText = $el.text().trim();
            if (href && href.includes('dl-protect.link')) {
                telechargerLinks.push({ text: linkText, href });
                console.log(`Found in 1fichier section: "${linkText}"`);
            }
        }
    });

    console.log(`\nLinks in 1fichier section: ${telechargerLinks.length}`);
}

testIRobotLinks().catch(console.error);
