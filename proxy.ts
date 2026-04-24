import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/features/auth/constants';
import { verifyJWT } from '@/lib/jwt';

// TEMP: Auth is disabled for easier testing. Flip to `false` (or remove this
// block) to restore the proxy auth gate. Mirrors the bypass in lib/auth.ts.
const AUTH_DISABLED = true;

const publicPaths = ['/login'];

export async function proxy(request: NextRequest) {
    if (AUTH_DISABLED) return NextResponse.next();

    const { pathname } = request.nextUrl;

    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJWT(token);
    if (!payload) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files and api routes
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};
