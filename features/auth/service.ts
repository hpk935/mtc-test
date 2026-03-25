import { hash, verify } from '@node-rs/argon2';
import { cookies } from 'next/headers';
import { signJWT, verifyJWT } from '@/lib/jwt';
import { SESSION_COOKIE_NAME, TOKEN_EXPIRY, COOKIE_MAX_AGE } from './constants';
import type { SessionPayload } from './types';

// OWASP-recommended Argon2id parameters
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const ARGON2_OPTIONS = {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
    algorithm: 2 as const, // Argon2id
};

export async function hashPassword(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
    hashed: string,
    password: string,
): Promise<boolean> {
    try {
        return await verify(hashed, password);
    } catch {
        return false;
    }
}

export async function createToken(payload: SessionPayload): Promise<string> {
    return signJWT(payload as unknown as Record<string, unknown>, TOKEN_EXPIRY);
}

export async function verifyToken(
    token: string,
): Promise<SessionPayload | null> {
    return verifyJWT<SessionPayload>(token);
}

export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
    });
}

export async function deleteSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
