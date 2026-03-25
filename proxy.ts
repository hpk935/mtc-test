import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/features/auth/constants';
import { verifyJWT } from '@/lib/jwt';

const publicPaths = ['/login'];

export async function proxy(request: NextRequest) {
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
