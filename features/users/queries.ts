import { eq, desc, asc, sql } from 'drizzle-orm';
import db from '@/lib/db';
import { users } from './schema';
import { generateEmployeeId } from './service';

export async function findUserByEmail(email: string) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    return user ?? null;
}

export async function findUserById(id: number) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
    return user ?? null;
}

export async function getNextEmployeeId(): Promise<string> {
    const [result] = await db
        .select({ maxId: sql<string>`max(${users.employeeId})` })
        .from(users);
    return generateEmployeeId(result?.maxId ?? null);
}

export async function getAllUsers(isActive?: boolean) {
    const query = db
        .select({
            id: users.id,
            employeeId: users.employeeId,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            permissions: users.permissions,
            isActive: users.isActive,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
        .from(users);

    if (isActive !== undefined) {
        query.where(eq(users.isActive, isActive));
    }

    return query.orderBy(asc(users.id));
}

export type UserListItem = Awaited<ReturnType<typeof getAllUsers>>[number];
