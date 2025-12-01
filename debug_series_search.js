const ztParser = require('./backend/NodeAPI/ztParser');
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.zone-telechargement.irish';
ztParser.useBaseURL(BASE_URL);

async function run() {
    try {
        const query = 'fallout';
        const page = 1;
        const category = 'series';

        const url = BASE_URL + `/?p=${category}&search=${encodeURI(query)}&page=${page}`;
        console.log('Fetching URL:', url);

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const content = $('#dle-content');
        console.log('Content length:', content.length);

        const covers = content.find('.cover_global');
        console.log('Found covers:', covers.length);

        if (covers.length === 0) {
            console.log('No covers found. Dumping some HTML...');
            console.log(content.html()?.substring(0, 500));
        } else {
            covers.each((i, el) => {
                const title = $(el).find('.cover_infos_title a').text();
                console.log(`Cover ${i}: ${title}`);
            });
        }

    } catch (e) {
        console.error(e);
    }
}

run();
