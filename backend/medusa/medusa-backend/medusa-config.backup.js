// Load environment variables
require('dotenv').config()
require('dotenv').config({ path: '../../../.env.local' })

// Construct DATABASE_URL from individual components
// Use non-pooling connection for Medusa migrations and operations
const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DATABASE}?sslmode=require`

console.log('Database URL configured:', DATABASE_URL ? 'Yes' : 'No')

module.exports = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseDriverOptions: {
      ssl: { 
        rejectUnauthorized: false
      }
    },
    databaseLogging: true,
    
    // Redis configuration (optional)
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

    // Session configuration
    sessionOptions: {
      ttl: 10 * 24 * 60 * 60 * 1000, // 10 days
    },
  },
  
  admin: {
    disable: false,
    path: '/app',
  },
  
  modules: [],
}