#!/usr/bin/env node

/**
 * First-time deployment setup script
 * This script helps set up Vercel projects for the monorepo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function executeCommand(command, silent = false) {
  try {
    const result = execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    return result;
  } catch (error) {
    if (!silent) {
      log(`Error executing: ${command}`, 'red');
    }
    return null;
  }
}

async function checkPrerequisites() {
  log('\n📋 Checking Prerequisites...', 'cyan');
  
  // Check Node.js version
  const nodeVersion = process.version;
  log(`✅ Node.js ${nodeVersion}`, 'green');
  
  // Check if Vercel CLI is installed
  const vercelVersion = executeCommand('vercel --version', true);
  if (!vercelVersion) {
    log('❌ Vercel CLI not installed', 'red');
    log('Installing Vercel CLI...', 'yellow');
    executeCommand('npm install -g vercel');
    log('✅ Vercel CLI installed', 'green');
  } else {
    log(`✅ Vercel CLI ${vercelVersion.trim()}`, 'green');
  }
  
  // Check if logged in to Vercel
  const vercelUser = executeCommand('vercel whoami', true);
  if (!vercelUser || vercelUser.includes('Error')) {
    log('⚠️  Not logged in to Vercel', 'yellow');
    log('Please login to Vercel:', 'cyan');
    executeCommand('vercel login');
  } else {
    log(`✅ Logged in as ${vercelUser.trim()}`, 'green');
  }
}

async function setupProject(name, directory, projectName) {
  log(`\n🔧 Setting up ${name}...`, 'cyan');
  
  const projectPath = path.join(process.cwd(), directory);
  
  // Check if already linked
  const vercelJsonPath = path.join(projectPath, '.vercel', 'project.json');
  if (fs.existsSync(vercelJsonPath)) {
    log(`✅ ${name} already linked to Vercel`, 'green');
    return;
  }
  
  // Link to Vercel
  log(`Linking ${name} to Vercel...`, 'yellow');
  process.chdir(projectPath);
  
  const linkCommand = `vercel link --yes`;
  executeCommand(linkCommand);
  
  log(`✅ ${name} linked successfully`, 'green');
  
  // Return to root
  process.chdir(path.join(projectPath, '../..'));
}

async function setupEnvironmentVariables() {
  log('\n🔐 Environment Variables Setup', 'cyan');
  
  const answer = await question('Do you want to set up environment variables now? (y/n): ');
  
  if (answer.toLowerCase() !== 'y') {
    log('Skipping environment variables setup', 'yellow');
    return;
  }
  
  log('\nYou need to add the following environment variables in Vercel Dashboard:', 'yellow');
  
  const envVars = [
    'DATABASE_URL - PostgreSQL connection string',
    'NEXTAUTH_URL - Your app URL (https://your-domain.vercel.app)',
    'NEXTAUTH_SECRET - Secret for JWT (generate with: openssl rand -base64 32)',
    'RESEND_API_KEY - API key from Resend for email',
    'RESEND_FROM_EMAIL - From email address',
    'R2_ACCOUNT_ID - Cloudflare R2 account ID',
    'R2_ACCESS_KEY_ID - Cloudflare R2 access key',
    'R2_SECRET_ACCESS_KEY - Cloudflare R2 secret',
    'R2_BUCKET_NAME - Cloudflare R2 bucket name',
    'KV_REST_API_URL - Vercel KV URL (optional)',
    'KV_REST_API_TOKEN - Vercel KV token (optional)',
  ];
  
  envVars.forEach(envVar => {
    log(`  • ${envVar}`, 'reset');
  });
  
  log('\nTo add these variables:', 'blue');
  log('1. Go to https://vercel.com/dashboard', 'reset');
  log('2. Select your project', 'reset');
  log('3. Go to Settings → Environment Variables', 'reset');
  log('4. Add each variable for Production, Preview, and Development', 'reset');
  
  const openDashboard = await question('\nOpen Vercel dashboard now? (y/n): ');
  if (openDashboard.toLowerCase() === 'y') {
    executeCommand('start https://vercel.com/dashboard');
  }
}

async function createGitHubSecrets() {
  log('\n🔑 GitHub Secrets Setup', 'cyan');
  
  log('For GitHub Actions deployment, add these secrets to your repository:', 'yellow');
  
  const secrets = [
    'VERCEL_TOKEN - Get from https://vercel.com/account/tokens',
    'VERCEL_ORG_ID - Found in .vercel/project.json',
    'VERCEL_PROJECT_ID_ADMIN - Found in .vercel/project.json',
    'VERCEL_PROJECT_ID_FABRIC_STORE - Found in experiences/fabric-store/.vercel/project.json',
    'VERCEL_PROJECT_ID_STORE_GUIDE - Found in experiences/store-guide/.vercel/project.json',
  ];
  
  secrets.forEach(secret => {
    log(`  • ${secret}`, 'reset');
  });
  
  // Try to read and display the IDs
  try {
    const adminProject = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
    log(`\n📝 Your Vercel Org ID: ${adminProject.orgId}`, 'green');
    log(`📝 Admin Project ID: ${adminProject.projectId}`, 'green');
  } catch (e) {
    // Ignore if file doesn't exist
  }
}

async function testDeployment() {
  log('\n🧪 Test Deployment', 'cyan');
  
  const answer = await question('Do you want to run a test deployment now? (y/n): ');
  
  if (answer.toLowerCase() !== 'y') {
    log('Skipping test deployment', 'yellow');
    return;
  }
  
  log('Running preview deployment of admin app...', 'yellow');
  executeCommand('npm run deploy:admin-preview');
  
  log('\n✅ Test deployment complete!', 'green');
}

async function main() {
  log('═'.repeat(60), 'cyan');
  log('   🚀 Tara Hub Deployment Setup', 'cyan');
  log('═'.repeat(60), 'cyan');
  
  try {
    // Step 1: Check prerequisites
    await checkPrerequisites();
    
    // Step 2: Install dependencies
    log('\n📦 Installing Dependencies...', 'cyan');
    executeCommand('npm install');
    log('✅ Dependencies installed', 'green');
    
    // Step 3: Set up Vercel projects
    log('\n🔗 Setting up Vercel Projects...', 'cyan');
    
    // Setup main admin app
    await setupProject('Admin App', '.', 'tara-hub');
    
    // Setup fabric store
    await setupProject('Fabric Store', 'experiences/fabric-store', 'tara-hub-fabric-store');
    
    // Setup store guide
    await setupProject('Store Guide', 'experiences/store-guide', 'tara-hub-store-guide');
    
    // Step 4: Environment variables
    await setupEnvironmentVariables();
    
    // Step 5: GitHub secrets
    await createGitHubSecrets();
    
    // Step 6: Test deployment
    await testDeployment();
    
    // Summary
    log('\n' + '═'.repeat(60), 'green');
    log('   ✅ Setup Complete!', 'green');
    log('═'.repeat(60), 'green');
    
    log('\n📚 Quick Reference:', 'cyan');
    log('  Deploy all to production:    npm run deploy:prod', 'reset');
    log('  Deploy admin only:           npm run deploy:admin', 'reset');
    log('  Deploy experiences:          npm run deploy:experiences', 'reset');
    log('  Quick deploy options:        npm run deploy:quick', 'reset');
    
    log('\n📖 For more information, see DEPLOYMENT_GUIDE.md', 'blue');
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
main();