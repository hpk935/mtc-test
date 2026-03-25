import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/features/auth/constants';
import { verifyToken } from '@/features/auth/service';
import type { Session } from '@/features/auth/types';

export async function getSession(): Promise<Session | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function requireAuth(): Promise<Session> {
    const session = await getSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function requireAdmin(): Promise<Session> {
    const session = await requireAuth();
    if (session.role !== 'admin') {
        throw new Error('Forbidden');
    }
    return session;
}
