const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Syncing environment variables from Vercel to local .env.local...\n');

// Get all environment variables from Vercel
try {
  // Pull all env vars from Vercel
  console.log('📥 Pulling environment variables from Vercel...\n');
  const envList = execSync('vercel env pull .env.vercel --yes', { encoding: 'utf8' });
  
  // Read the pulled env file
  const vercelEnvPath = path.join(process.cwd(), '.env.vercel');
  const localEnvPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(vercelEnvPath)) {
    console.error('❌ Failed to pull environment variables from Vercel');
    process.exit(1);
  }
  
  // Read both files
  const vercelEnvContent = fs.readFileSync(vercelEnvPath, 'utf8');
  const localEnvContent = fs.existsSync(localEnvPath) ? fs.readFileSync(localEnvPath, 'utf8') : '';
  
  // Parse environment variables
  const parseEnv = (content) => {
    const env = {};
    const lines = content.split('\n');
    for (const line of lines) {
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
    return env;
  };
  
  const vercelEnv = parseEnv(vercelEnvContent);
  const localEnv = parseEnv(localEnvContent);
  
  // Merge environments (Vercel values take precedence for existing keys)
  const mergedEnv = { ...localEnv, ...vercelEnv };
  
  // Build the new .env.local content
  let newContent = '';
  
  // Group environment variables by category
  const categories = {
    'Authentication': ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'],
    'Google OAuth': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    'Vercel KV': ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    'Neon Database': ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING', 'POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_PASSWORD', 'POSTGRES_DATABASE', 'POSTGRES_URL_NO_SSL', 'POSTGRES_PRISMA_URL'],
    'Resend Email': ['EMAIL_SERVER_USER', 'EMAIL_SERVER_PASSWORD', 'EMAIL_SERVER_HOST', 'EMAIL_SERVER_PORT', 'EMAIL_FROM'],
    'Stack Auth': ['NEXT_PUBLIC_STACK_PROJECT_ID', 'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY', 'STACK_SECRET_SERVER_KEY'],
    'Other': []
  };
  
  // Track which keys have been written
  const writtenKeys = new Set();
  
  // Write categorized environment variables
  for (const [category, keys] of Object.entries(categories)) {
    const categoryVars = keys.filter(key => mergedEnv[key]);
    if (categoryVars.length > 0 || category === 'Other') {
      if (category !== 'Other') {
        newContent += `# ${category}\n`;
        categoryVars.forEach(key => {
          newContent += `${key}=${mergedEnv[key]}\n`;
          writtenKeys.add(key);
        });
        newContent += '\n';
      }
    }
  }
  
  // Write any remaining variables under "Other"
  const otherVars = Object.keys(mergedEnv).filter(key => !writtenKeys.has(key));
  if (otherVars.length > 0) {
    newContent += '# Other\n';
    otherVars.forEach(key => {
      newContent += `${key}=${mergedEnv[key]}\n`;
    });
  }
  
  // Backup existing .env.local
  if (fs.existsSync(localEnvPath)) {
    const backupPath = `${localEnvPath}.backup.${Date.now()}`;
    fs.copyFileSync(localEnvPath, backupPath);
    console.log(`📁 Backed up existing .env.local to ${path.basename(backupPath)}\n`);
  }
  
  // Write the new .env.local
  fs.writeFileSync(localEnvPath, newContent.trim());
  console.log('✅ Updated .env.local with Vercel environment variables\n');
  
  // Clean up the temporary file
  fs.unlinkSync(vercelEnvPath);
  
  // Show summary
  console.log('📊 Summary:');
  console.log(`   - Total variables: ${Object.keys(mergedEnv).length}`);
  console.log(`   - From Vercel: ${Object.keys(vercelEnv).length}`);
  console.log(`   - Local only: ${Object.keys(localEnv).length - Object.keys(vercelEnv).length}`);
  
  // List new variables from Vercel
  const newVars = Object.keys(vercelEnv).filter(key => !localEnv[key]);
  if (newVars.length > 0) {
    console.log('\n📝 New variables from Vercel:');
    newVars.forEach(key => {
      const value = vercelEnv[key];
      const maskedValue = value && value.length > 20 ? value.substring(0, 15) + '...' : value;
      console.log(`   - ${key} = ${maskedValue}`);
    });
  }
  
  console.log('\n✅ Sync complete! Your .env.local now has all Vercel environment variables.');
  
} catch (error) {
  console.error('❌ Error syncing environment variables:', error.message);
  console.log('\n💡 Make sure you are logged in to Vercel CLI:');
  console.log('   Run: vercel login');
  process.exit(1);
}