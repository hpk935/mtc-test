// scripts/seed.ts — Dev seed data
// Run with: npm run db:seed
//
// Usage:
//   1. Add seed functions per feature module
//   2. Call them in order (respecting foreign key dependencies)
//
// import db from '../src/lib/db';

async function seed() {
    console.log('🌱 Seeding database...');

    // TODO: Add seed calls per feature, e.g.:
    // await seedUsers();
    // await seedCustomers();
    // await seedProducts();
    // await seedOrders();

    console.log('✅ Seeding complete.');
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
