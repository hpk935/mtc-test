// scripts/import/cleanup-customers.ts — Clear customer data for fresh import
// Run with: npx tsx scripts/import/cleanup-customers.ts

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function cleanup() {
    const { default: db } = await import('../../lib/db');
    const { sql } = await import('drizzle-orm');
    // Truncate customers and cascade to dependent tables
    await db.execute(sql`TRUNCATE TABLE customers CASCADE`);
    console.log('Truncated customers (cascade)');

    // Delete placeholder salesperson users (keep admin)
    await db.execute(
        sql`DELETE FROM users WHERE email LIKE '%@mtc.com' AND email != 'admin@mtc.com'`,
    );
    console.log('Deleted placeholder salesperson users');

    // Reset users serial sequence
    await db.execute(
        sql`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))`,
    );
    console.log('Reset users id sequence');

    // Verify
    const custCount = await db.execute(
        sql`SELECT count(*) as count FROM customers`,
    );
    const userCount = await db.execute(
        sql`SELECT count(*) as count FROM users`,
    );
    console.log(
        'Customers:',
        custCount[0].count,
        '| Users:',
        userCount[0].count,
    );

    process.exit(0);
}

cleanup().catch((e) => {
    console.error(e);
    process.exit(1);
});
