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

    // 1. Test User Info (Validate Key)
    console.log('\n--- Test 1: User Info (Validate Key) ---');
    try {
        const response = await ky.post('https://api.1fichier.com/v1/user/info.cgi', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            json: {},
            throwHttpErrors: false
        });
        const body = await response.json<any>();
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(body, null, 2));
    } catch (error) {
        console.error('User Info check failed:', error);
    }

    // 2. Test Download with Auth Variations
    console.log('\n--- Test 2: Download Token (Auth Variations) ---');
    const authHeaders = [
        { 'Authorization': `Bearer ${API_KEY}` },
        { 'Authorization': API_KEY }, // Plain key
        { 'Api-Key': API_KEY }, // Custom header
    ];

    for (const headers of authHeaders) {
        console.log(`\nTrying Headers: ${JSON.stringify(headers)}`);
        try {
            const response = await ky.post('https://api.1fichier.com/v1/download/get_token.cgi', {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                json: { url: TEST_URL },
                throwHttpErrors: false
            });

            const body = await response.json<any>();
            console.log(`Status: ${response.status}`);
            console.log('Response:', JSON.stringify(body, null, 2));

            if (response.ok && body.url) {
                console.log('SUCCESS! Found working header format.');
                return;
            }
        } catch (error) {
            console.error('Request failed:', error);
        }
    }
}

testApi();
