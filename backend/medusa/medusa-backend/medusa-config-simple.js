// Simple Medusa configuration for testing
require('dotenv').config()

// Use the non-pooling URL
const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING

console.log('Using database URL:', DATABASE_URL ? 'Configured' : 'Not found')

module.exports = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseDriverOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    },
    http: {
      compression: true,
      port: 9000,
      host: '0.0.0.0',
    },
    storeCors: "http://localhost:3006,http://localhost:3007,http://localhost:3000",
    adminCors: "http://localhost:3000,http://localhost:7001",
    authCors: "http://localhost:3000,http://localhost:3006",
    jwtSecret: process.env.JWT_SECRET || 'supersecret',
    cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
  },
  admin: {
    disable: false,
    path: '/app',
  },
  modules: [],
}