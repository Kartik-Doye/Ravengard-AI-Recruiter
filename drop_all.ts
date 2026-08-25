import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_ADMIN_USER,
  password: process.env.SQL_ADMIN_PASSWORD,
  database: process.env.SQL_DB_NAME,
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    for (let row of res.rows) {
      if (row.tablename !== 'drizzle') {
        console.log("Dropping table " + row.tablename);
        await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
      }
    }
    console.log("All tables dropped");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
