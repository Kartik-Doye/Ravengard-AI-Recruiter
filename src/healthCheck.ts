import { db } from './db/index';
import { sql } from 'drizzle-orm';
import express from 'express';

export const healthCheckRouter = express.Router();

healthCheckRouter.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - start;
    
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`
      },
      memory: process.memoryUsage()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
