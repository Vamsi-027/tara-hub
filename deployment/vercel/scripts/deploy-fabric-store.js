#!/usr/bin/env node

/**
 * Deployment script for Fabric Store Experience
 * Usage: npm run deploy:fabric-store [--prod]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description, cwd = null) {
  log(`\n📦 ${description}...`, 'blue');
  try {
    const options = { stdio: 'inherit' };
    if (cwd) options.cwd = cwd;
    execSync(command, options);
    log(`✅ ${description} completed!`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error during ${description}`, 'red');
    console.error(error.message);
    return false;
  }
}

async function deployFabricStore() {
  const isProd = process.argv.includes('--prod');
  const experiencePath = path.join(process.cwd(), 'frontend', 'experiences', 'fabric-store');
  
  log('\n🚀 Starting Fabric Store Deployment', 'yellow');
  log(`Mode: ${isProd ? 'Production' : 'Preview'}`, 'blue');

  // Step 1: Check if experience directory exists
  if (!fs.existsSync(experiencePath)) {
    log(`❌ Experience directory not found: ${experiencePath}`, 'red');
    process.exit(1);
  }

  // Step 2: Install dependencies at root (needed for workspace)
  if (!executeCommand('npm install', 'Installing root dependencies')) {
    process.exit(1);
  }

  // Step 3: Build the fabric-store app
  if (!executeCommand('npm run build', 'Building Fabric Store', experiencePath)) {
    log('Build failed. Fix errors before deploying.', 'red');
    process.exit(1);
  }

  // Step 4: Check if Vercel project is linked
  const vercelJsonPath = path.join(experiencePath, '.vercel', 'project.json');
  if (!fs.existsSync(vercelJsonPath)) {
    log('Linking Vercel project...', 'yellow');
    executeCommand(
      'vercel link --yes --project tara-hub-fabric-store',
      'Linking to Vercel',
      experiencePath
    );
  }

  // Step 5: Deploy to Vercel
  let deployCommand = 'vercel';
  
  if (isProd) {
    deployCommand += ' --prod';
  }
  
  deployCommand += ' --yes'; // Skip confirmation

  if (!executeCommand(deployCommand, `Deploying to Vercel ${isProd ? '(Production)' : '(Preview)'}`, experiencePath)) {
    process.exit(1);
  }

  // Step 6: Show deployment info
  log('\n✨ Fabric Store Deployment Complete!', 'green');
  
  if (isProd) {
    log('Production URL: https://tara-hub-fabric-store.vercel.app', 'blue');
  }
  
  log('\nLocal development:', 'yellow');
  log('  cd experiences/fabric-store && npm run dev', 'reset');
}

// Run deployment
deployFabricStore().catch(error => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});