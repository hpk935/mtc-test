// scripts/migrate.ts — Run migrations programmatically
// Run with: npx tsx scripts/migrate.ts
//
// Most of the time, use `npm run db:migrate` (drizzle-kit migrate) instead.
// This script is for cases where you need programmatic migration control
// (e.g., CI/CD pipelines, custom migration logic).

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
}

async function runMigrations() {
    const client = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(client);

    console.log('🔄 Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations complete.');

    await client.end();
}

runMigrations().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
