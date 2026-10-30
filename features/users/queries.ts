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
    // Compare the numeric part: as text, 'E99' sorts after 'E100'.
    const [result] = await db
        .select({
            maxNum: sql<
                number | null
            >`max(substring(${users.employeeId} from 2)::int) filter (where ${users.employeeId} ~ '^E[0-9]+$')`,
        })
        .from(users);
    return generateEmployeeId(
        result?.maxNum != null ? `E${result.maxNum}` : null,
    );
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
