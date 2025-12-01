const ztParser = require('./backend/NodeAPI/ztParser');

const BASE_URL = 'https://www.zone-telechargement.irish';
ztParser.useBaseURL(BASE_URL);

async function run() {
    try {
        console.log('Searching for joker...');
        const results = await ztParser.search('films', 'joker', 1);
        // The logs inside ztParser should print to stderr
    } catch (e) {
        console.error(e);
    }
}

run();
