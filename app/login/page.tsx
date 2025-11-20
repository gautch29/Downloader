import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export default async function LoginPage() {
    // Check if user is already logged in with a VALID session
    const userId = await getSession();

    if (userId) {
        // Session is valid, redirect to home
        redirect('/');
    }

    // Session is invalid or missing, show login form
    return <LoginForm />;
}
