// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Set DATABASE_URL for Drizzle if not set
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

// Run drizzle-kit push
const { execSync } = require('child_process');

console.log('Pushing schema to Neon database...');
console.log('Database URL:', process.env.POSTGRES_URL?.substring(0, 30) + '...');

try {
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('✅ Schema pushed successfully!');
} catch (error) {
  console.error('❌ Error pushing schema:', error.message);
  process.exit(1);
}