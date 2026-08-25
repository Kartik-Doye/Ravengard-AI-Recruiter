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
    await client.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS candidate_id text;');
    console.log("Migration successful");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
