// Medusa v2 configuration  
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Use non-pooling connection for Medusa migrations
const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL

console.log('Database URL configured:', DATABASE_URL ? 'Yes' : 'No')

module.exports = {
  projectConfig: {
    // Database configuration with TypeORM-style SSL settings
    databaseUrl: DATABASE_URL,
    databaseExtra: {
      ssl: {
        rejectUnauthorized: false
      }
    },
    
    // Optional Redis configuration
    redisUrl: process.env.REDIS_URL || process.env.KV_URL,
    
    // CORS settings - Allow frontend access
    storeCors: process.env.STORE_CORS || "http://localhost:3006,http://localhost:3007,http://localhost:3000",
    adminCors: process.env.ADMIN_CORS || "http://localhost:3000,http://localhost:7001",
    authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:3006",
    
    // Security
    jwtSecret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'supersecret',
    cookieSecret: process.env.COOKIE_SECRET || process.env.NEXTAUTH_SECRET || 'supersecret',
    
    // Server configuration
    http: {
      compression: true,
      port: process.env.PORT ? parseInt(process.env.PORT) : 9000,
      host: '0.0.0.0',
    },
  },
  
  admin: {
    disable: false,
    path: '/app',
  },
  
  modules: [],
}