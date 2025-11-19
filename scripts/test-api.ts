import ky from 'ky';
import 'dotenv/config';

const API_KEY = process.env.ONEFICHIER_API_KEY;
const TEST_URL = process.argv[2] || 'https://1fichier.com/?e3f1cv7shlvnvdoc63ty';

async function testApi() {
    if (!API_KEY) {
        console.error('Error: ONEFICHIER_API_KEY is not set in .env');
        return;
    }

    console.log('Testing 1fichier API...');
    console.log(`API Key: ${API_KEY.substring(0, 5)}...`);
    console.log(`Target URL: ${TEST_URL}`);

    // 1. Test Auth (List files - simplified)
    // Note: 'ls' might require folder_id, but let's try a basic user info or similar if available.
    // Actually, let's just try the download endpoint with different formats.

    const formats = [
        TEST_URL,
        TEST_URL.split('&')[0], // Remove affiliate params
        TEST_URL.replace('https://1fichier.com/?', ''), // Just the code
    ];

    for (const url of formats) {
        console.log(`\nTrying URL format: "${url}"`);
        try {
            const response = await ky.post('https://api.1fichier.com/v1/download/get_token.cgi', {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                json: { url },
                throwHttpErrors: false
            });

            const body = await response.json<any>();
            console.log(`Status: ${response.status}`);
            console.log('Response:', JSON.stringify(body, null, 2));

            if (response.ok && body.url) {
                console.log('SUCCESS! Found working format.');
                return;
            }
        } catch (error) {
            console.error('Request failed:', error);
        }
    }
}

testApi();
