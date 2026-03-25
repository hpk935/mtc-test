// scripts/seed.ts — Dev seed data
// Run with: npm run db:seed

import db from '../lib/db';
import { users } from '../features/users/schema';
import { hashPassword } from '../features/auth/service';

async function seedUsers() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log('  Users already seeded, skipping.');
    return;
  }

  const passwordHash = await hashPassword('admin123');
  await db.insert(users).values({
    employeeId: 'E01',
    email: 'admin@mtc.com',
    passwordHash,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  });
  console.log('  Created admin user (admin@mtc.com / admin123)');
}

async function seed() {
  console.log('🌱 Seeding database...');
  await seedUsers();
  console.log('✅ Seeding complete.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
