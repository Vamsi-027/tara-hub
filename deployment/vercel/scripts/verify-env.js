#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Ensures all required environment variables are configured for each Vercel project
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Define required environment variables for each app
const envRequirements = {
  // Shared across all deployments
  shared: {
    required: [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'POSTGRES_URL',
      'POSTGRES_URL_NON_POOLING',
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL',
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID', 
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME'
    ],
    optional: [
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ]
  },
  
  // Admin-specific
  'tara-hub': {
    required: [],
    optional: [],
    public: [
      'NEXT_PUBLIC_APP_NAME=Admin Dashboard'
    ]
  },
  
  // Fabric Store specific
  'tara-hub-fabric-store': {
    required: [],
    optional: [],
    public: [
      'NEXT_PUBLIC_APP_NAME=Fabric Store',
      'NEXT_PUBLIC_APP_TYPE=ecommerce'
    ]
  },
  
  // Store Guide specific
  'tara-hub-store-guide': {
    required: [],
    optional: [],
    public: [
      'NEXT_PUBLIC_APP_NAME=Store Guide',
      'NEXT_PUBLIC_APP_TYPE=content'
    ]
  }
};

function checkEnvironment(projectName) {
  log(`\n📋 Checking environment for: ${projectName}`, 'blue');
  
  const shared = envRequirements.shared;
  const specific = envRequirements[projectName] || { required: [], optional: [], public: [] };
  
  let missingRequired = [];
  let missingOptional = [];
  let presentVars = [];
  
  // Check shared required
  shared.required.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingRequired.push(varName);
    }
  });
  
  // Check shared optional
  shared.optional.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingOptional.push(varName);
    }
  });
  
  // Check app-specific required
  specific.required.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingRequired.push(varName);
    }
  });
  
  // Check app-specific optional
  specific.optional.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingOptional.push(varName);
    }
  });
  
  // Report results
  if (missingRequired.length > 0) {
    log(`\n❌ Missing REQUIRED variables:`, 'red');
    missingRequired.forEach(v => log(`   - ${v}`, 'red'));
  }
  
  if (missingOptional.length > 0) {
    log(`\n⚠️  Missing OPTIONAL variables:`, 'yellow');
    missingOptional.forEach(v => log(`   - ${v}`, 'yellow'));
  }
  
  if (presentVars.length > 0) {
    log(`\n✅ Configured variables (${presentVars.length}):`, 'green');
    // Only show first 5 to avoid clutter
    presentVars.slice(0, 5).forEach(v => log(`   - ${v}`, 'green'));
    if (presentVars.length > 5) {
      log(`   ... and ${presentVars.length - 5} more`, 'green');
    }
  }
  
  // Public variables info
  if (specific.public && specific.public.length > 0) {
    log(`\n📢 Required PUBLIC variables:`, 'magenta');
    specific.public.forEach(v => log(`   - ${v}`, 'magenta'));
  }
  
  return missingRequired.length === 0;
}

function generateVercelCommands(projectName) {
  const shared = envRequirements.shared;
  const specific = envRequirements[projectName] || { required: [], optional: [], public: [] };
  
  log(`\n🔧 Vercel CLI commands to set environment variables:`, 'blue');
  log(`\n# Navigate to the correct directory first:`, 'yellow');
  
  if (projectName === 'tara-hub') {
    log(`cd ${process.cwd()}`, 'yellow');
  } else {
    const appDir = projectName.replace('tara-hub-', '');
    log(`cd experiences/${appDir}`, 'yellow');
  }
  
  log(`\n# Set required environment variables:`, 'yellow');
  
  // Generate commands for missing variables
  [...shared.required, ...specific.required].forEach(varName => {
    if (!process.env[varName]) {
      log(`vercel env add ${varName} production`, 'white');
    }
  });
  
  log(`\n# Set optional environment variables (if needed):`, 'yellow');
  [...shared.optional, ...specific.optional].forEach(varName => {
    if (!process.env[varName]) {
      log(`vercel env add ${varName} production`, 'white');
    }
  });
  
  // Public variables
  if (specific.public && specific.public.length > 0) {
    log(`\n# Set public environment variables:`, 'yellow');
    specific.public.forEach(v => {
      const [key, value] = v.split('=');
      log(`vercel env add ${key} production # Value: ${value}`, 'white');
    });
  }
  
  log(`\n# Pull environment variables to verify:`, 'yellow');
  log(`vercel env pull`, 'white');
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const projectName = args[0];
  
  if (!projectName) {
    log(`\n🚨 ENVIRONMENT VARIABLE VERIFICATION REPORT`, 'red');
    log(`${'='.repeat(50)}`, 'red');
    
    // Check all projects
    const projects = ['tara-hub', 'tara-hub-fabric-store', 'tara-hub-store-guide'];
    let allValid = true;
    
    projects.forEach(project => {
      const isValid = checkEnvironment(project);
      if (!isValid) allValid = false;
    });
    
    if (!allValid) {
      log(`\n\n⚠️  CRITICAL: Environment variables are missing!`, 'red');
      log(`\nRun this script with a project name to get setup commands:`, 'yellow');
      log(`  node deployment/vercel/scripts/verify-env.js tara-hub`, 'yellow');
      log(`  node deployment/vercel/scripts/verify-env.js tara-hub-fabric-store`, 'yellow');
      log(`  node deployment/vercel/scripts/verify-env.js tara-hub-store-guide`, 'yellow');
      process.exit(1);
    } else {
      log(`\n✅ All environment variables are configured!`, 'green');
    }
  } else {
    // Check specific project and provide commands
    const isValid = checkEnvironment(projectName);
    if (!isValid) {
      generateVercelCommands(projectName);
      log(`\n\n📝 After setting variables, redeploy with:`, 'blue');
      log(`  npm run deploy:${projectName.replace('tara-hub', 'admin').replace('-', ':')}`, 'yellow');
    }
  }
}

// Show help
if (process.argv.includes('--help')) {
  console.log(`
Environment Variable Verification Script

Usage:
  node deployment/vercel/scripts/verify-env.js [project-name]

Projects:
  tara-hub                 Admin Dashboard
  tara-hub-fabric-store    Fabric Store
  tara-hub-store-guide     Store Guide

Options:
  --help                   Show this help message

Examples:
  node deployment/vercel/scripts/verify-env.js
  node deployment/vercel/scripts/verify-env.js tara-hub
  node deployment/vercel/scripts/verify-env.js tara-hub-fabric-store
`);
  process.exit(0);
}

main();