#!/usr/bin/env node

/**
 * Deployment script for Main Admin App
 * Usage: npm run deploy:admin [--prod]
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

function executeCommand(command, description) {
  log(`\n📦 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed!`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error during ${description}`, 'red');
    console.error(error.message);
    return false;
  }
}

async function deployAdmin() {
  const isProd = process.argv.includes('--prod');
  const isPreview = process.argv.includes('--preview');
  
  log('\n🚀 Starting Admin App Deployment', 'yellow');
  log(`Mode: ${isProd ? 'Production' : isPreview ? 'Preview' : 'Development'}`, 'blue');

  // Step 1: Check for uncommitted changes
  try {
    const gitStatus = execSync('git status --porcelain').toString();
    if (gitStatus && !process.argv.includes('--force')) {
      log('\n⚠️  Warning: You have uncommitted changes', 'yellow');
      log('Add --force to deploy anyway or commit your changes first', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    log('Git check skipped', 'yellow');
  }

  // Step 2: Run tests (optional, can be enabled)
  if (process.argv.includes('--test')) {
    if (!executeCommand('npm test', 'Running tests')) {
      process.exit(1);
    }
  }

  // Step 3: Type check
  if (!process.argv.includes('--skip-typecheck')) {
    executeCommand('npx tsc --noEmit', 'Type checking');
  }

  // Step 4: Lint check
  if (!process.argv.includes('--skip-lint')) {
    executeCommand('npm run lint', 'Linting');
  }

  // Step 5: Build locally to catch errors early
  if (!process.argv.includes('--skip-build')) {
    if (!executeCommand('npm run build:admin', 'Building locally')) {
      log('Build failed. Fix errors before deploying.', 'red');
      process.exit(1);
    }
  }

  // Step 6: Deploy to Vercel
  let deployCommand = 'vercel';
  
  if (isProd) {
    deployCommand += ' --prod';
  } else if (!isPreview) {
    deployCommand += ' --dev';
  }
  
  deployCommand += ' --yes'; // Skip confirmation

  if (!executeCommand(deployCommand, `Deploying to Vercel ${isProd ? '(Production)' : '(Preview)'}`)) {
    process.exit(1);
  }

  // Step 7: Show deployment info
  log('\n✨ Deployment Complete!', 'green');
  
  if (isProd) {
    log('Production URL: https://tara-hub.vercel.app', 'blue');
  }
  
  log('\nUseful commands:', 'yellow');
  log('  vercel logs          - View deployment logs', 'reset');
  log('  vercel --prod        - Deploy to production', 'reset');
  log('  vercel env pull      - Pull environment variables', 'reset');
  log('  npm run deploy:all   - Deploy all apps', 'reset');
}

// Run deployment
deployAdmin().catch(error => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});