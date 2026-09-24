import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    let config: PoolConfig = {
      max: 20, // Increased max pool size for production
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    };

    if (process.env.DATABASE_URL) {
      config.connectionString = process.env.DATABASE_URL;
    } else {
      config.host = process.env.SQL_HOST;
      config.user = process.env.SQL_USER;
      config.password = process.env.SQL_PASSWORD;
      config.database = process.env.SQL_DB_NAME;
      config.port = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432;
    }

    if (process.env.DB_REQUIRE_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false };
    } else {
      config.ssl = false;
    }

    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, draining DB pool');
      global._postgresPool?.end();
    });
  }
  return global._postgresPool;
};

export const createAdminPool = () => {
  let config: PoolConfig = {
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    host: process.env.SQL_HOST,
    user: process.env.SQL_ADMIN_USER || process.env.SQL_USER,
    password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
    ssl: process.env.DB_REQUIRE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
  return new Pool(config);
};

const pool = createPool();

export const db = drizzle(pool, { schema });
