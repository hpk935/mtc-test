// scripts/import/seed-reference-codes.ts — Apply term and territory definitions
// Run with: npx tsx scripts/import/seed-reference-codes.ts

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { TERMS, TERRITORY_NAMES } from './reference-codes';

async function main() {
    const { default: db } = await import('../../lib/db');
    const { terms, territories } = await import(
        '../../features/reference-codes/schema'
    );
    const { sql } = await import('drizzle-orm');

    await db
        .insert(terms)
        .values(TERMS)
        .onConflictDoUpdate({
            target: terms.code,
            set: {
                description: sql`excluded.description`,
                netDays: sql`excluded.net_days`,
                isActive: sql`excluded.is_active`,
                updatedAt: new Date(),
            },
        });
    console.log(`  Terms applied: ${TERMS.length}`);

    if (TERRITORY_NAMES.length > 0) {
        await db
            .insert(territories)
            .values(TERRITORY_NAMES)
            .onConflictDoUpdate({
                target: territories.code,
                set: { name: sql`excluded.name`, updatedAt: new Date() },
            });
    }
    console.log(`  Territory names applied: ${TERRITORY_NAMES.length}`);

    console.log('\n✅ Reference codes applied.\n');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
