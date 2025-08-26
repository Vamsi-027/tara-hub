#!/usr/bin/env node

/**
 * Environment Variable Loader Script
 * 
 * This script loads environment variables from the organized env/ folder structure
 * and combines them into a single .env.local file for Next.js to use.
 * 
 * Usage:
 *   node scripts/load-env.js                 # Load all env files
 *   node scripts/load-env.js --app=admin     # Load for specific app
 *   node scripts/load-env.js --env=production # Load for specific environment
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ENV_DIR = path.join(__dirname, '..', 'env');
const ROOT_DIR = path.join(__dirname, '..');

// Environment file modules in loading order
const ENV_MODULES = [
  '.env.common',
  '.env.auth',
  '.env.database',
  '.env.cache',
  '.env.email',
  '.env.storage',
  '.env.vercel'
];

/**
 * Load environment variables from a file
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Environment file not found: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const envVars = {};

  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=');
      envVars[key.trim()] = value.trim();
    }
  });

  return envVars;
}

/**
 * Combine all environment modules into a single object
 */
function combineEnvModules() {
  let combinedEnv = {};

  ENV_MODULES.forEach(module => {
    const filePath = path.join(ENV_DIR, module);
    const moduleEnv = loadEnvFile(filePath);
    combinedEnv = { ...combinedEnv, ...moduleEnv };
    console.log(`✅ Loaded ${Object.keys(moduleEnv).length} variables from ${module}`);
  });

  return combinedEnv;
}

/**
 * Write combined environment variables to .env.local
 */
function writeEnvLocal(envVars, targetPath = path.join(ROOT_DIR, '.env.local')) {
  const content = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(targetPath, content);
  console.log(`\n✅ Written ${Object.keys(envVars).length} environment variables to ${targetPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Loading environment variables from modular structure...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const appArg = args.find(arg => arg.startsWith('--app='));
  const app = appArg ? appArg.split('=')[1] : null;

  // Load all environment modules
  const combinedEnv = combineEnvModules();

  // Write to appropriate location
  if (app === 'fabric-store') {
    const targetPath = path.join(ROOT_DIR, 'experiences', 'fabric-store', '.env.local');
    // For experience apps, only include necessary variables
    const appEnv = {
      // Include only what fabric-store needs
      KV_REST_API_URL: combinedEnv.KV_REST_API_URL,
      KV_REST_API_TOKEN: combinedEnv.KV_REST_API_TOKEN,
      // Add app-specific variables
      NEXT_PUBLIC_APP_PORT: '3006',
      NEXT_PUBLIC_APP_NAME: 'Fabric Store'
    };
    writeEnvLocal(appEnv, targetPath);
  } else if (app === 'store-guide') {
    const targetPath = path.join(ROOT_DIR, 'experiences', 'store-guide', '.env.local');
    // Store guide needs more variables
    const appEnv = {
      ...combinedEnv, // Store guide needs all variables
      // Override with app-specific
      NEXT_PUBLIC_APP_PORT: '3007',
      NEXT_PUBLIC_APP_NAME: 'Store Guide'
    };
    writeEnvLocal(appEnv, targetPath);
  } else {
    // Default: write to root .env.local
    writeEnvLocal(combinedEnv);
  }

  console.log('\n🎉 Environment variables loaded successfully!');
}

// Run the script
if (require.main === module) {
  main();
}