import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

// Fallback logic for when individual SQL vars are set without DATABASE_URL
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && process.env.SQL_HOST) {
  dbUrl = `postgresql://${process.env.SQL_USER}:${process.env.SQL_PASSWORD}@${process.env.SQL_HOST}:${process.env.SQL_PORT || 5432}/${process.env.SQL_DB_NAME}`;
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl!,
  },
} satisfies Config;
