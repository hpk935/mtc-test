'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, count, eq, ne } from 'drizzle-orm';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { users } from './schema';
import { findUserByEmail, findUserById, getNextEmployeeId } from './queries';
import { hashPassword } from '@/features/auth/service';
import {
    createUserSchema,
    updateUserSchema,
    resetPasswordSchema,
} from './validation';
import { DEFAULT_PERMISSIONS } from './constants';
import type { Permission, UserRole } from './constants';
import type { ActionResult } from '@/types';

const LAST_ADMIN_ERROR =
    'There must be at least one active admin. Make another user an admin first.';

/** Would this change leave the app with no active admin? */
async function removesLastActiveAdmin(
    user: { id: number; role: UserRole; isActive: boolean },
    next: { role: UserRole; isActive: boolean },
): Promise<boolean> {
    const isActiveAdmin = user.role === 'admin' && user.isActive;
    const staysActiveAdmin = next.role === 'admin' && next.isActive;
    if (!isActiveAdmin || staysActiveAdmin) return false;

    const [{ others }] = await db
        .select({ others: count() })
        .from(users)
        .where(
            and(
                eq(users.role, 'admin'),
                eq(users.isActive, true),
                ne(users.id, user.id),
            ),
        );
    return others === 0;
}

/** Strip non-view permissions if the module's view permission is missing. */
function sanitizePermissions(permissions: Permission[]): Permission[] {
    const set = new Set(permissions);
    return permissions.filter((perm) => {
        const [module, action] = perm.split(':');
        if (action === 'view') return true;
        return set.has(`${module}:view` as Permission);
    });
}

export async function createUser(
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const raw = Object.fromEntries(formData);
    const permissionsRaw = formData.getAll('permissions') as string[];
    const parsed = createUserSchema.safeParse({
        ...raw,
        permissions: permissionsRaw,
    });

    if (!parsed.success) {
        return {
            success: false,
            error: 'Please check all fields and try again.',
        };
    }

    const { email, password, firstName, lastName, role, permissions } =
        parsed.data;

    const existing = await findUserByEmail(email);
    if (existing) {
        return {
            success: false,
            error: 'A user with this email already exists.',
        };
    }

    const passwordHash = await hashPassword(password);
    const employeeId = await getNextEmployeeId();
    const effectivePermissions = sanitizePermissions(
        permissions.length > 0 ? permissions : DEFAULT_PERMISSIONS[role],
    );

    await db.insert(users).values({
        employeeId,
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        permissions: effectivePermissions,
    });

    redirect('/users');
}

export async function updateUser(
    userId: number,
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const raw = Object.fromEntries(formData);
    const permissionsRaw = formData.getAll('permissions') as string[];
    const parsed = updateUserSchema.safeParse({
        ...raw,
        permissions: permissionsRaw,
        isActive: raw.isActive === 'true',
    });

    if (!parsed.success) {
        return {
            success: false,
            error: 'Please check all fields and try again.',
        };
    }

    const { firstName, lastName, email, role, permissions, isActive } =
        parsed.data;

    const user = await findUserById(userId);
    if (!user) {
        return { success: false, error: 'User not found.' };
    }

    // Check email uniqueness if changed
    if (email !== user.email) {
        const existing = await findUserByEmail(email);
        if (existing) {
            return {
                success: false,
                error: 'A user with this email already exists.',
            };
        }
    }

    const nextIsActive = isActive ?? user.isActive;
    if (await removesLastActiveAdmin(user, { role, isActive: nextIsActive })) {
        return { success: false, error: LAST_ADMIN_ERROR };
    }

    await db
        .update(users)
        .set({
            firstName,
            lastName,
            email,
            role,
            permissions: sanitizePermissions(permissions),
            isActive: nextIsActive,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);
    revalidatePath(`/users/${userId}/edit`);
    return { success: true, data: undefined };
}

export async function resetUserPassword(
    userId: number,
    _prevState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    await requireAdmin();

    const raw = Object.fromEntries(formData);
    const parsed = resetPasswordSchema.safeParse(raw);

    if (!parsed.success) {
        return {
            success: false,
            error: 'Password must be at least 8 characters.',
        };
    }

    const user = await findUserById(userId);
    if (!user) {
        return { success: false, error: 'User not found.' };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

    return { success: true, data: undefined };
}

export async function toggleUserActive(userId: number): Promise<ActionResult> {
    await requireAdmin();

    const user = await findUserById(userId);
    if (!user) {
        return { success: false, error: 'User not found.' };
    }

    if (
        await removesLastActiveAdmin(user, {
            role: user.role,
            isActive: !user.isActive,
        })
    ) {
        return { success: false, error: LAST_ADMIN_ERROR };
    }

    await db
        .update(users)
        .set({ isActive: !user.isActive, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath('/users');
    return { success: true, data: undefined };
}
