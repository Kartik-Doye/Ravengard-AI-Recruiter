import { db } from './src/db/index.ts';
import { candidates } from './src/db/schema.ts';

async function seed() {
  await db.insert(candidates).values({ id: 'test-user-id', email: 'test@example.com', name: 'Test User' }).onConflictDoNothing();
  console.log('seeded');
}
seed();
