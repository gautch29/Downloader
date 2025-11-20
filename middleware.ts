import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session');
    const isLoginPage = request.nextUrl.pathname === '/login';

    console.log(`[Middleware] Path: ${request.nextUrl.pathname}, Session: ${sessionCookie ? 'Present' : 'Missing'}`);


    // If no session cookie and not on login page, redirect to login
    if (!sessionCookie && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // We allow access to /login even if session cookie exists
    // This handles "zombie cookies" (invalid sessions) where middleware sees a cookie
    // but the app knows it's invalid. The login page itself will handle valid session redirects.

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
