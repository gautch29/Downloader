import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session');
    const isLoginPage = request.nextUrl.pathname === '/login';

    // If no session and not on login page, redirect to login
    if (!session && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If has session and on login page, redirect to home
    if (session && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
