const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Environment variables to sync
const envVars = [
  { key: 'NEXTAUTH_SECRET', value: process.env.NEXTAUTH_SECRET },
  { key: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID },
  { key: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET },
  { key: 'POSTGRES_URL', value: process.env.POSTGRES_URL },
  { key: 'POSTGRES_URL_NON_POOLING', value: process.env.POSTGRES_URL_NON_POOLING },
  { key: 'POSTGRES_USER', value: process.env.POSTGRES_USER },
  { key: 'POSTGRES_HOST', value: process.env.POSTGRES_HOST },
  { key: 'POSTGRES_PASSWORD', value: process.env.POSTGRES_PASSWORD },
  { key: 'POSTGRES_DATABASE', value: process.env.POSTGRES_DATABASE },
  { key: 'POSTGRES_URL_NO_SSL', value: process.env.POSTGRES_URL_NO_SSL },
  { key: 'POSTGRES_PRISMA_URL', value: process.env.POSTGRES_PRISMA_URL },
  { key: 'EMAIL_SERVER_USER', value: process.env.EMAIL_SERVER_USER },
  { key: 'EMAIL_SERVER_PASSWORD', value: process.env.EMAIL_SERVER_PASSWORD },
  { key: 'EMAIL_SERVER_HOST', value: process.env.EMAIL_SERVER_HOST },
  { key: 'EMAIL_SERVER_PORT', value: process.env.EMAIL_SERVER_PORT },
  { key: 'EMAIL_FROM', value: process.env.EMAIL_FROM },
];

console.log('🔄 Syncing environment variables to Vercel...\n');

// First, we need to get the production URL
try {
  const projectInfo = execSync('vercel project ls', { encoding: 'utf8' });
  console.log('Project info retrieved.\n');
} catch (error) {
  console.log('Project not linked. Linking now...\n');
  execSync('vercel link', { stdio: 'inherit' });
}

// Add each environment variable
for (const { key, value } of envVars) {
  if (value && value !== 'your-google-client-id' && value !== 'your-google-client-secret') {
    try {
      // Remove existing variable first (if any)
      execSync(`vercel env rm ${key} production --yes`, { 
        encoding: 'utf8',
        stdio: 'pipe' 
      });
    } catch {
      // Variable doesn't exist, that's okay
    }

    try {
      // Add the new value
      const maskedValue = value.length > 20 ? value.substring(0, 10) + '...' : value;
      console.log(`Setting ${key} = ${maskedValue}`);
      
      // Create a temporary file with the value
      const tempFile = path.join(__dirname, '.temp-env-value');
      fs.writeFileSync(tempFile, value);
      
      // Add to Vercel
      execSync(`vercel env add ${key} production < "${tempFile}"`, { 
        encoding: 'utf8',
        stdio: 'pipe',
        shell: true
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      console.log(`✅ ${key} set successfully\n`);
    } catch (error) {
      console.error(`❌ Failed to set ${key}: ${error.message}\n`);
    }
  }
}

// Set NEXTAUTH_URL to the production URL
console.log('\n📝 Note: NEXTAUTH_URL will be updated after deployment to match your production URL.');
console.log('You can update it manually in the Vercel dashboard after deployment.\n');

console.log('✅ Environment variables sync complete!');
console.log('\n📌 Next steps:');
console.log('1. Run: vercel --prod');
console.log('2. Update NEXTAUTH_URL in Vercel dashboard to your production URL');
console.log('3. Update Google OAuth redirect URLs to include your production domain');