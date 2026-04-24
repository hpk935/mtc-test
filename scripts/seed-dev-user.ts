// scripts/seed-dev-user.ts — Seed a DEV admin user so AUTH_DISABLED stub session works.
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
    const { default: db } = await import('../lib/db');
    const { users } = await import('../features/users/schema');
    const { hashPassword } = await import('../features/auth/service');
    const { eq } = await import('drizzle-orm');

    const existing = await db
        .select()
        .from(users)
        .where(eq(users.employeeId, 'DEV'))
        .limit(1);

    if (existing.length > 0) {
        console.log('DEV user already exists.');
        process.exit(0);
    }

    const passwordHash = await hashPassword('changeme123');
    await db.insert(users).values({
        employeeId: 'DEV',
        email: 'dev@local',
        passwordHash,
        firstName: 'Dev',
        lastName: 'User',
        role: 'admin',
    });
    console.log('✅ Created DEV admin user.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
