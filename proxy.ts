import { NextRequest, NextResponse } from 'next/server';

// Auth middleware — redirect unauthenticated users to login
// TODO: Implement session check when auth is built

const publicPaths = ['/login'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // TODO: Check session cookie/token here
    // const session = ...
    // if (!session) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files and api routes
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};
