#!/usr/bin/env node

/**
 * Master deployment script for all apps in the monorepo
 * Usage: npm run deploy:all [--prod] [--parallel]
 */

const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('═'.repeat(50), 'cyan');
  log(`  ${title}`, 'cyan');
  log('═'.repeat(50), 'cyan');
  console.log('');
}

async function deployApp(name, script, color) {
  const startTime = Date.now();
  log(`\n🚀 Deploying ${name}...`, color);
  
  try {
    const args = process.argv.slice(2).filter(arg => arg !== '--parallel').join(' ');
    const command = `node ${script} ${args}`;
    
    if (process.argv.includes('--parallel')) {
      // Run in background for parallel deployment
      return execAsync(command).then(() => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        log(`✅ ${name} deployed successfully (${duration}s)`, 'green');
        return { app: name, success: true, duration };
      }).catch(error => {
        log(`❌ ${name} deployment failed`, 'red');
        console.error(error.message);
        return { app: name, success: false, error: error.message };
      });
    } else {
      // Run sequentially
      execSync(command, { stdio: 'inherit' });
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`✅ ${name} deployed successfully (${duration}s)`, 'green');
      return { app: name, success: true, duration };
    }
  } catch (error) {
    log(`❌ ${name} deployment failed`, 'red');
    console.error(error.message);
    return { app: name, success: false, error: error.message };
  }
}

async function setupEnvironmentVariables() {
  log('\n🔐 Setting up environment variables...', 'magenta');
  
  try {
    const envScript = path.join(__dirname, 'manage-env-vars.js');
    const env = process.argv.includes('--prod') ? 'production' : 'development';
    
    // Push env vars for each app
    for (const app of ['admin', 'fabric-store', 'store-guide']) {
      try {
        log(`  Pushing env vars for ${app}...`, 'blue');
        execSync(`node ${envScript} push ${app} ${env}`, { stdio: 'pipe' });
        log(`  ✅ ${app} environment configured`, 'green');
      } catch (error) {
        log(`  ⚠️  Failed to push env vars for ${app}`, 'yellow');
      }
    }
    
    return true;
  } catch (error) {
    log('⚠️  Environment variable setup failed', 'yellow');
    return false;
  }
}

async function deployAll() {
  const startTime = Date.now();
  const isProd = process.argv.includes('--prod');
  const isParallel = process.argv.includes('--parallel');
  const withEnv = process.argv.includes('--with-env');
  const appsToSkip = process.argv
    .filter(arg => arg.startsWith('--skip-'))
    .map(arg => arg.replace('--skip-', ''));

  logSection('🚀 Tara Hub Monorepo Deployment');
  
  log(`Mode: ${isProd ? 'PRODUCTION' : 'PREVIEW'}`, isProd ? 'red' : 'yellow');
  log(`Strategy: ${isParallel ? 'PARALLEL' : 'SEQUENTIAL'}`, 'blue');
  log(`Environment Sync: ${withEnv ? 'ENABLED' : 'DISABLED'}`, 'magenta');
  
  if (appsToSkip.length > 0) {
    log(`Skipping: ${appsToSkip.join(', ')}`, 'yellow');
  }

  // Pre-deployment checks
  logSection('Pre-deployment Checks');

  // Check for uncommitted changes
  try {
    const gitStatus = execSync('git status --porcelain').toString();
    if (gitStatus && !process.argv.includes('--force')) {
      log('⚠️  Warning: You have uncommitted changes', 'yellow');
      log('Add --force to deploy anyway or commit your changes first', 'yellow');
      
      if (isProd) {
        log('\n❌ Cannot deploy to production with uncommitted changes', 'red');
        process.exit(1);
      }
    } else {
      log('✅ Git status clean', 'green');
    }
  } catch (error) {
    log('⚠️  Git check skipped', 'yellow');
  }

  // Setup environment variables if requested
  if (withEnv) {
    await setupEnvironmentVariables();
  }

  // Install dependencies once for all
  if (!process.argv.includes('--skip-install')) {
    log('\n📦 Installing dependencies...', 'blue');
    execSync('npm install', { stdio: 'inherit' });
    log('✅ Dependencies installed', 'green');
  }

  // Deployment configuration
  const deployments = [
    {
      name: 'Admin App',
      script: path.join(__dirname, 'deploy-admin.js'),
      skip: appsToSkip.includes('admin'),
      color: 'magenta'
    },
    {
      name: 'Fabric Store',
      script: path.join(__dirname, 'deploy-fabric-store.js'),
      skip: appsToSkip.includes('fabric-store'),
      color: 'blue'
    },
    {
      name: 'Store Guide',
      script: path.join(__dirname, 'deploy-store-guide.js'),
      skip: appsToSkip.includes('store-guide'),
      color: 'yellow'
    }
  ];

  // Deploy apps
  logSection('Deploying Applications');

  const activeDeploys = deployments.filter(d => !d.skip);
  let results = [];

  if (isParallel) {
    // Deploy all apps in parallel
    log('🚀 Starting parallel deployments...', 'cyan');
    const promises = activeDeploys.map(deploy => 
      deployApp(deploy.name, deploy.script, deploy.color)
    );
    results = await Promise.all(promises);
  } else {
    // Deploy apps sequentially
    for (const deploy of activeDeploys) {
      const result = await deployApp(deploy.name, deploy.script, deploy.color);
      results.push(result);
    }
  }

  // Summary
  logSection('Deployment Summary');

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    log('✅ Successful Deployments:', 'green');
    successful.forEach(r => {
      log(`   • ${r.app} (${r.duration}s)`, 'green');
    });
  }

  if (failed.length > 0) {
    log('\n❌ Failed Deployments:', 'red');
    failed.forEach(r => {
      log(`   • ${r.app}: ${r.error || 'Unknown error'}`, 'red');
    });
  }

  log(`\n⏱️  Total deployment time: ${totalDuration}s`, 'cyan');

  // Production URLs
  if (isProd && successful.length > 0) {
    logSection('Production URLs');
    log('🌐 Admin App: https://tara-hub.vercel.app', 'magenta');
    log('🌐 Fabric Store: https://tara-hub-fabric-store.vercel.app', 'blue');
    log('🌐 Store Guide: https://tara-hub-store-guide.vercel.app', 'yellow');
  }

  // Exit with error if any deployments failed
  if (failed.length > 0) {
    process.exit(1);
  }

  log('\n✨ All deployments completed successfully!', 'green');
}

// Show help
if (process.argv.includes('--help')) {
  console.log(`
Tara Hub Deployment Script

Usage:
  npm run deploy:all [options]

Options:
  --prod          Deploy to production (default: preview)
  --parallel      Deploy all apps in parallel (faster)
  --with-env      Push environment variables to Vercel
  --force         Deploy even with uncommitted changes
  --skip-install  Skip npm install step
  --skip-admin    Skip admin app deployment
  --skip-fabric-store  Skip fabric store deployment
  --skip-store-guide   Skip store guide deployment
  --help          Show this help message

Examples:
  npm run deploy:all                    Deploy all apps to preview
  npm run deploy:all --prod            Deploy all apps to production
  npm run deploy:all --prod --parallel Deploy all to production in parallel
  npm run deploy:all --skip-admin      Deploy only experiences
  `);
  process.exit(0);
}

// Run deployment
deployAll().catch(error => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});