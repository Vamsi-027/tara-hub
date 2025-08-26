import { defineConfig, loadEnv } from '@medusajs/framework/utils'

// Load environment variables from parent directory
loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Try to load from parent .env.local
try {
  require('dotenv').config({ path: '../.env.local' })
} catch (e) {
  // Fallback to default env loading
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL
const REDIS_URL = process.env.KV_REST_API_URL

export default defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseDriverOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    redisUrl: REDIS_URL,
    
    // CORS settings
    storeCors: process.env.STORE_CORS || "http://localhost:3006,http://localhost:3007,http://localhost:3000",
    adminCors: process.env.ADMIN_CORS || "http://localhost:3000,http://localhost:9001",
    authCors: process.env.AUTH_CORS || "http://localhost:3000",
    
    // Security
    jwtSecret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    cookieSecret: process.env.COOKIE_SECRET || process.env.NEXTAUTH_SECRET,
    
    // Server configuration
    http: {
      compression: true,
      port: process.env.MEDUSA_PORT ? parseInt(process.env.MEDUSA_PORT) : 9000,
      host: '0.0.0.0',
    },

    // Session configuration
    sessionOptions: {
      ttl: 10 * 24 * 60 * 60 * 1000, // 10 days
    },
  },
  
  admin: {
    disable: false,
    path: '/admin',
  },
  
  modules: [
    // Custom modules
    {
      resolve: './src/modules/tenant',
      key: 'tenantModuleService',
    },
    {
      resolve: './src/modules/fabric-product',
      key: 'fabricProductModuleService',
    },
    
    // Core commerce modules
    {
      resolve: '@medusajs/medusa/product',
    },
    {
      resolve: '@medusajs/medusa/pricing',
    },
    {
      resolve: '@medusajs/medusa/order',
    },
    {
      resolve: '@medusajs/medusa/cart',
    },
    {
      resolve: '@medusajs/medusa/customer',
    },
    {
      resolve: '@medusajs/medusa/region',
    },
    {
      resolve: '@medusajs/medusa/sales-channel',
    },
    {
      resolve: '@medusajs/medusa/tax',
    },
    {
      resolve: '@medusajs/medusa/fulfillment',
    },
    {
      resolve: '@medusajs/medusa/payment',
    },
    {
      resolve: '@medusajs/medusa/inventory',
    },
    {
      resolve: '@medusajs/medusa/stock-location',
    },
    
    // File service
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          // Use R2 if configured, otherwise local
          ...(process.env.R2_BUCKET_NAME ? [{
            resolve: '@medusajs/medusa/file-s3',
            id: 'r2',
            options: {
              file_url: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
              access_key_id: process.env.R2_ACCESS_KEY_ID,
              secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
              region: 'auto',
              bucket: process.env.R2_BUCKET_NAME,
              endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            },
          }] : [{
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: {
              upload_dir: './uploads',
            },
          }])
        ],
      },
    },
    
    // Cache service (Redis if available)
    ...(REDIS_URL ? [{
      resolve: '@medusajs/medusa/cache-redis',
      options: {
        redisUrl: REDIS_URL,
        ttl: 60,
      },
    }] : [{
      resolve: '@medusajs/medusa/cache-inmemory',
    }]),
    
    // Event bus (Redis if available)
    ...(REDIS_URL ? [{
      resolve: '@medusajs/medusa/event-bus-redis',
      options: {
        redisUrl: REDIS_URL,
      },
    }] : [{
      resolve: '@medusajs/medusa/event-bus-local',
    }]),
    
    // Workflow engine
    {
      resolve: '@medusajs/medusa/workflow-engine-inmemory',
    },
  ],
})