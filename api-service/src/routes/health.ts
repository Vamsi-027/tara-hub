import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from '@upstash/redis';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      api: 'ok',
      database: 'checking',
      redis: 'checking'
    }
  };

  // Check database connection
  try {
    if (process.env.DATABASE_URL) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      const result = await pool.query('SELECT NOW()');
      await pool.end();
      
      health.checks.database = 'ok';
    } else {
      health.checks.database = 'not configured';
    }
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  // Check Redis connection
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN
      });
      
      await redis.ping();
      health.checks.redis = 'ok';
    } else {
      health.checks.redis = 'not configured';
    }
  } catch (error) {
    health.checks.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Liveness probe (for Kubernetes/Railway)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (for Kubernetes/Railway)
router.get('/ready', async (req: Request, res: Response) => {
  // Simple check - can be expanded based on requirements
  const isReady = true; // Add actual readiness logic here
  
  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;