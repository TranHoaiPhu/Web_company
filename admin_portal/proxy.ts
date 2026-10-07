import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    const isLoginPage = request.nextUrl.pathname === '/login';

    if (!token && !isLoginPage) {
        // If not logged in and not on login page, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token && isLoginPage) {
        // If logged in and on login page, redirect to dashboard
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// Config to specify which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
