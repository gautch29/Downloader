// Test script for zt-film-api with explicit URL
import ZTP from 'zt-film-api';

async function testZTAPI() {
    console.log('Testing ZT API with explicit URL...\n');

    try {
        // Step 1: Initialize with explicit URL
        console.log('1. Setting base URL to: https://zone-telechargement.irish');
        ZTP.useBaseURL('https://zone-telechargement.irish');
        console.log('✓ Base URL set\n');

        // Step 2: Search for a popular movie
        console.log('2. Searching for "Avatar"...');
        const results = await ZTP.search('films', 'Avatar');

        console.log(`✓ Search completed`);
        console.log(`   Results type: ${typeof results}`);
        console.log(`   Is array: ${Array.isArray(results)}`);
        console.log(`   Results count: ${results?.length || 0}\n`);

        // Step 3: Display results
        if (results && Array.isArray(results) && results.length > 0) {
            console.log('3. First 3 results:');
            results.slice(0, 3).forEach((result, i) => {
                console.log(`\n   Result ${i + 1}:`);
                console.log(`   Title: ${result.title || result.name || 'Unknown'}`);
                console.log(`   Keys: ${Object.keys(result).join(', ')}`);
            });

            console.log('\n4. Full first result:');
            console.log(JSON.stringify(results[0], null, 2));
        } else {
            console.log('3. No results found or invalid response');
            console.log('   Response type:', typeof results);
            console.log('   Response:', JSON.stringify(results, null, 2));
        }

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
        }
    }
}

testZTAPI();
