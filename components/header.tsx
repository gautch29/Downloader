import { HeaderClient } from './header-client';
import { cookies } from 'next/headers';

const API_URL = 'http://localhost:8080/api';

export async function Header() {
    let username = 'User';

    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        if (sessionId) {
            const response = await fetch(`${API_URL}/auth/session`, {
                headers: { 'Cookie': `session_id=${sessionId}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    username = data.user.username;
                }
            }
        }
    } catch (e) {
        // Ignore error
    }

    return <HeaderClient username={username} />;
}
