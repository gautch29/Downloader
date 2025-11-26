import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';
import { cookies } from 'next/headers';

const API_URL = 'http://localhost:8080/api';

export default async function LoginPage() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
        try {
            const response = await fetch(`${API_URL}/auth/session`, {
                headers: { 'Cookie': `session_id=${sessionId}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    redirect('/');
                }
            }
        } catch (e) {
            // Ignore error, show login form
        }
    }

    return <LoginForm />;
}
