// Check if zt-film-api has methods to get download links
import ZTP from 'zt-film-api';

async function checkAPICapabilities() {
    console.log('Checking zt-film-api capabilities...\n');

    try {
        ZTP.useBaseURL('https://zone-telechargement.irish');

        // Get search results first
        const results = await ZTP.search('films', 'Joker');

        if (results && results.length > 0) {
            const firstMovie = results[0];
            console.log('First movie:', firstMovie);
            console.log('\nMovie properties:', Object.keys(firstMovie));

            // Check if there's a method to get details/links
            console.log('\n=== Available ZTP methods ===');
            console.log(Object.getOwnPropertyNames(ZTP).filter(name => typeof ZTP[name] === 'function'));

            // Try common method names
            const methodsToTry = ['getLinks', 'getDownloadLinks', 'getFilmDetails', 'getDetails', 'fetchLinks'];

            for (const method of methodsToTry) {
                if (typeof ZTP[method] === 'function') {
                    console.log(`\n✓ Found method: ${method}`);
                    try {
                        const result = await ZTP[method](firstMovie.id);
                        console.log('Result:', result);
                    } catch (err) {
                        console.log('Error calling:', err.message);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAPICapabilities();
