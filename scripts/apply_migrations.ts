import "dotenv/config";
import fs from "fs";
import path from "path";
import { createPool } from "../src/db/index";

async function applyMigrations() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    console.log("Setting search_path to ravengard...");
    await client.query("CREATE SCHEMA IF NOT EXISTS ravengard AUTHORIZATION ravengard;");
    await client.query("SET search_path TO ravengard;");

    const migrationFiles = [
      "drizzle/0000_lowly_hardball.sql",
      "drizzle/0001_confused_silvermane.sql"
    ];

    for (const file of migrationFiles) {
      const filePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Migration file not found: ${file}`);
        continue;
      }

      console.log(`Applying ${file}...`);
      let rawSql = fs.readFileSync(filePath, "utf-8");
      // Clean schema references to point to ravengard
      rawSql = rawSql.replace(/"public"\./g, '"ravengard".');
      // Split by statement breakpoint
      const statements = rawSql
        .split("--> statement-breakpoint")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (err: any) {
          // If already exists, ignore
          if (err.code === "42P07" || err.code === "42710" || err.message?.includes("already exists")) {
            // Already exists, skip
          } else {
            console.warn(`Statement warning [${err.code}]:`, err.message);
          }
        }
      }
    }

    // Verify all created tables in ravengard schema
    const res = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'ravengard' ORDER BY table_name;`
    );
    console.log(`\n✅ Successfully initialized ${res.rows.length} tables in schema 'ravengard':`);
    console.log(res.rows.map(r => r.table_name).join(", "));

  } catch (err: any) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

applyMigrations();
