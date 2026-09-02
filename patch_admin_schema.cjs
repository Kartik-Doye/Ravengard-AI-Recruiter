const fs = require('fs');
let file = fs.readFileSync('src/db/schema.ts', 'utf8');

const newTables = `
export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('viewer'),
  createdAt: timestamp('created_at').defaultNow()
});

export const adminLogs = pgTable('admin_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').references(() => adminUsers.id),
  action: text('action').notNull(),
  target: text('target'),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata')
});
`;

if (!file.includes('admin_users')) {
  file = file + "\n" + newTables;
  fs.writeFileSync('src/db/schema.ts', file);
}
