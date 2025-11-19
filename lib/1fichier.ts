import ky from 'ky';
import { setDefaultResultOrder } from 'node:dns';

// Force IPv4 to avoid 1fichier "IP Locked" error on IPv6
try {
    setDefaultResultOrder('ipv4first');
} catch (e) {
    console.warn('Could not set default DNS result order:', e);
}

const API_KEY = process.env.ONEFICHIER_API_KEY;

interface DownloadLinkResponse {
    url: string;
    status: string;
    message?: string;
}

export class OneFichierClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getDownloadLink(url: string): Promise<string> {
        // Clean the URL: remove any affiliate parameters (everything after &)
        // Keep only the base part: https://1fichier.com/?xyz123
        const cleanUrl = url.split('&')[0];
        console.log(`Requesting link for: ${cleanUrl} (Original: ${url})`);

        try {
            const response = await ky.post('https://api.1fichier.com/v1/download/get_token.cgi', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                json: {
                    url: cleanUrl,
                }
            }).json<any>();

            // Adjust based on actual API response structure
            if (response.url) {
                return response.url;
            } else if (response.link) {
                return response.link;
            }

            throw new Error('No download link found in response');
        } catch (error: any) {
            if (error.name === 'HTTPError') {
                const errorBody = await error.response.text();
                console.error('1fichier API Error Response:', errorBody);
            }
            console.error('Error getting 1fichier link:', error);
            throw error;
        }
    }

    // Alternative method if the above is not the exact endpoint
    // Some implementations use a different endpoint for premium users to "convert" the link
}

export const oneFichier = new OneFichierClient(API_KEY || '');
