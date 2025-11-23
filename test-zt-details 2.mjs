// Test getting movie details from ZT
import ZTP from 'zt-film-api';

async function testMovieDetails() {
    console.log('Testing movie detail page fetching...\n');

    try {
        // Initialize
        ZTP.useBaseURL('https://zone-telechargement.irish');

        // Search for a movie
        const results = await ZTP.search('films', 'Avatar');

        if (results && results.length > 0) {
            const firstMovie = results[0];
            console.log('First movie:', firstMovie);
            console.log('\nMovie URL:', firstMovie.url);
            console.log('Movie ID:', firstMovie.id);

            // Check if there's a method to get details
            console.log('\nAvailable ZTP methods:');
            console.log(Object.getOwnPropertyNames(ZTP).filter(name => typeof ZTP[name] === 'function'));

            // Try to get movie details if method exists
            if (typeof ZTP.getFilmDetails === 'function') {
                console.log('\nFetching details for movie ID:', firstMovie.id);
                const details = await ZTP.getFilmDetails(firstMovie.id);
                console.log('Details:', JSON.stringify(details, null, 2));
            } else {
                console.log('\nNo getFilmDetails method found');
                console.log('Will need to scrape the detail page manually');
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testMovieDetails();
