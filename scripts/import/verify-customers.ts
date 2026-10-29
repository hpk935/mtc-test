// scripts/import/verify-customers.ts — Quick verification of imported data
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function verify() {
    const { default: db } = await import('../../lib/db');
    const { sql } = await import('drizzle-orm');

    // Spot check first customer
    const [c] = await db.execute(
        sql`SELECT customer_number, customer_name, primary_contact_name, billing_city, billing_state_code, account_status, main_email, salesperson_code, default_freight_term, account_open_date FROM customers WHERE customer_number = '00-123'`,
    );
    console.log('\n--- Customer 00-123 ---');
    console.log(JSON.stringify(c, null, 2));

    // Status distribution
    const statuses = await db.execute(
        sql`SELECT account_status, count(*) FROM customers GROUP BY account_status ORDER BY account_status`,
    );
    console.log('\n--- Status Distribution ---');
    statuses.forEach((r) => console.log(`  ${r.account_status}: ${r.count}`));

    // Salesperson count
    const [sp] = await db.execute(
        sql`SELECT count(*) as count FROM users WHERE employee_id LIKE 'E%'`,
    );
    console.log(`\nSalesperson users: ${sp.count}`);

    // Total
    const [total] = await db.execute(
        sql`SELECT count(*) as count FROM customers`,
    );
    console.log(`Total customers: ${total.count}`);

    process.exit(0);
}

verify().catch((e) => {
    console.error(e);
    process.exit(1);
});
