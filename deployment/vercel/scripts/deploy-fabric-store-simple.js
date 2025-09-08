#!/usr/bin/env node

/**
 * Simple deployment script for Fabric Store - bypasses build issues
 */

const { execSync } = require('child_process');
const path = require('path');

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

async function deployFabricStore() {
  const isProd = process.argv.includes('--prod');
  const experiencePath = path.join(process.cwd(), 'frontend', 'experiences', 'fabric-store');
  
  log('\n🚀 Simple Fabric Store Deployment', 'yellow');
  log(`Mode: ${isProd ? 'Production' : 'Preview'}`, 'blue');
  
  try {
    // Change to fabric-store directory and deploy
    process.chdir(experiencePath);
    
    let deployCommand = 'vercel';
    if (isProd) {
      deployCommand += ' --prod';
    }
    deployCommand += ' --yes --force';
    
    log('🚀 Deploying to Vercel...', 'blue');
    execSync(deployCommand, { stdio: 'inherit' });
    
    log('\n✅ Deployment Complete!', 'green');
    if (isProd) {
      log('Production URL: https://fabric-store-ten.vercel.app', 'blue');
    }
    
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

deployFabricStore();