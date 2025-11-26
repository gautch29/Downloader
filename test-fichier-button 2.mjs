// Find the specific 1fichier download button
import axios from 'axios';
import * as cheerio from 'cheerio';

async function findFichierButton() {
    try {
        const testUrl = 'https://zone-telechargement.irish?p=film&id=12862-joker';
        console.log('Fetching:', testUrl, '\n');

        const response = await axios.get(testUrl);
        const $ = cheerio.load(response.data);

        console.log('=== Looking for 1fichier section ===\n');

        // Look for elements containing "1fichier" text
        $('*').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes('1fichier') && text.length < 100) {
                const tagName = el.tagName;
                console.log(`Found "${text}" in <${tagName}>`);

                // Look for download links near this element
                const parent = $(el).parent();
                const siblings = $(el).siblings();

                // Check for links in parent
                parent.find('a[href*="dl-protect"]').each((_, link) => {
                    const href = $(link).attr('href');
                    const linkText = $(link).text().trim();
                    console.log(`  -> Parent has link: "${linkText}" -> ${href}`);
                });

                // Check for links in siblings
                siblings.filter('a[href*="dl-protect"]').each((_, link) => {
                    const href = $(link).attr('href');
                    const linkText = $(link).text().trim();
                    console.log(`  -> Sibling link: "${linkText}" -> ${href}`);
                });

                // Check next element
                const next = $(el).next();
                if (next.is('a[href*="dl-protect"]')) {
                    console.log(`  -> Next element is link: ${next.attr('href')}`);
                }

                console.log('');
            }
        });

        // Also look for structure around "Télécharger" buttons
        console.log('\n=== All "Télécharger" buttons with context ===\n');
        $('a:contains("Télécharger")').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();

            // Get surrounding context
            const parent = $(el).parent();
            const parentText = parent.text().trim().substring(0, 200);

            console.log(`${i + 1}. "${text}"`);
            console.log(`   Href: ${href}`);
            console.log(`   Context: ${parentText}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

findFichierButton();
