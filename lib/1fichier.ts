import ky from 'ky';

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
        // 1fichier API implementation for getting a download link
        // Based on common 1fichier API patterns. 
        // Note: The official API docs are behind a login, but generally it involves sending the link and auth.
        // For premium accounts, we might just need to request the link with the API key.

        // This is a simplified implementation assuming a direct download link generation endpoint exists
        // or using the 'download' endpoint.

        // If the API requires a specific payload, it should be adjusted here.
        // For now, we'll assume a standard POST request to get the link.

        try {
            const response = await ky.post('https://api.1fichier.com/v1/download/get_token.cgi', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                json: {
                    url: url,
                }
            }).json<any>();

            // Adjust based on actual API response structure
            if (response.url) {
                return response.url;
            } else if (response.link) {
                return response.link;
            }

            throw new Error('No download link found in response');
        } catch (error) {
            console.error('Error getting 1fichier link:', error);
            throw error;
        }
    }

    // Alternative method if the above is not the exact endpoint
    // Some implementations use a different endpoint for premium users to "convert" the link
}

export const oneFichier = new OneFichierClient(API_KEY || '');
