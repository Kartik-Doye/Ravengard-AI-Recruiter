import "dotenv/config";
import { createPool } from "../src/db/index";

async function inspect() {
  const pool = createPool();
  if (!pool) return;
  const res = await pool.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);
  console.log("Existing columns in DB:");
  for (const row of res.rows) {
    console.log(`  ${row.table_name}.${row.column_name} (${row.data_type})`);
  }
  process.exit(0);
}

inspect();
