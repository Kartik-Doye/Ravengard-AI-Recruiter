import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';

async function seed() {
  await db.insert(users).values({ id: 'test-user-id', email: 'test@example.com', name: 'Test User' }).onConflictDoNothing();
  console.log('seeded');
}
seed();
