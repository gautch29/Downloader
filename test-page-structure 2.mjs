// Check page structure more carefully
import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectPage() {
    try {
        const testUrl = 'https://zone-telechargement.irish?p=film&id=12862-joker';
        console.log('Fetching:', testUrl, '\n');

        const response = await axios.get(testUrl);
        const $ = cheerio.load(response.data);

        // Look for download sections
        console.log('=== Looking for download-related elements ===\n');

        // Check for common download class names
        const downloadClasses = ['.download', '.telecharger', '.liens', '.links', '.hebergeur'];
        downloadClasses.forEach(cls => {
            const elements = $(cls);
            if (elements.length > 0) {
                console.log(`Found ${elements.length} elements with class "${cls}"`);
                elements.slice(0, 3).each((i, el) => {
                    console.log(`  ${i + 1}. ${$(el).text().substring(0, 100)}`);
                });
                console.log('');
            }
        });

        // Look for buttons
        console.log('=== Buttons ===');
        $('button, .btn, .button').slice(0, 5).each((i, el) => {
            console.log(`  ${i + 1}. ${$(el).text().trim()}`);
        });
        console.log('');

        // Look for any base64 or encoded content
        console.log('=== Checking for encoded content ===');
        const html = response.data;
        if (html.includes('atob') || html.includes('base64')) {
            console.log('  Found base64 encoding in page');
        }
        if (html.includes('decrypt') || html.includes('decode')) {
            console.log('  Found decrypt/decode references');
        }

        // Check if there's a specific download page link
        console.log('\n=== Links containing "download" or "telecharger" ===');
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().toLowerCase();
            if (text.includes('download') || text.includes('télécharger') || text.includes('telecharger')) {
                console.log(`  Text: "${$(el).text().trim()}"`);
                console.log(`  Href: ${href}\n`);
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

inspectPage();
