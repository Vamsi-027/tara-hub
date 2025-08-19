#!/usr/bin/env node

/**
 * Quick deployment script with common presets
 * Usage: npm run deploy:quick [preset]
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const scriptsDir = path.join(__dirname);

const presets = {
  'admin-only': {
    description: 'Deploy only admin app to production',
    command: `node ${path.join(scriptsDir, 'deploy-admin.js')} --prod --skip-typecheck --skip-lint`
  },
  'admin-preview': {
    description: 'Quick preview deployment of admin app',
    command: `node ${path.join(scriptsDir, 'deploy-admin.js')} --skip-typecheck --skip-lint --skip-build`
  },
  'experiences': {
    description: 'Deploy both experience apps',
    command: `node ${path.join(scriptsDir, 'deploy-all.js')} --prod --skip-admin --parallel`
  },
  'all-prod': {
    description: 'Deploy everything to production',
    command: `node ${path.join(scriptsDir, 'deploy-all.js')} --prod --parallel`
  },
  'all-preview': {
    description: 'Deploy everything to preview',
    command: `node ${path.join(scriptsDir, 'deploy-all.js')} --parallel`
  },
  'fabric-store': {
    description: 'Deploy fabric store to production',
    command: `node ${path.join(scriptsDir, 'deploy-fabric-store.js')} --prod`
  },
  'store-guide': {
    description: 'Deploy store guide to production',
    command: `node ${path.join(scriptsDir, 'deploy-store-guide.js')} --prod`
  },
  'hotfix': {
    description: 'Emergency deployment (skips all checks)',
    command: 'vercel --prod --yes --force'
  }
};

function showHelp() {
  log('\n🚀 Quick Deploy - Preset Deployment Commands\n', 'cyan');
  log('Usage: npm run deploy:quick <preset>\n', 'yellow');
  log('Available Presets:', 'blue');
  
  Object.entries(presets).forEach(([name, config]) => {
    log(`\n  ${name}`, 'green');
    log(`    ${config.description}`, 'reset');
    log(`    Command: ${config.command}`, 'cyan');
  });

  log('\nExamples:', 'yellow');
  log('  npm run deploy:quick admin-only', 'reset');
  log('  npm run deploy:quick all-prod', 'reset');
  log('  npm run deploy:quick hotfix', 'reset');
  
  log('\n💡 Tip: Add these to package.json for even quicker access:', 'blue');
  log('  "deploy:prod": "node scripts/deploy-all.js --prod --parallel"', 'reset');
  log('  "deploy:admin": "node scripts/deploy-admin.js --prod"', 'reset');
}

function main() {
  const preset = process.argv[2];

  if (!preset || preset === '--help' || preset === '-h') {
    showHelp();
    process.exit(0);
  }

  if (!presets[preset]) {
    log(`\n❌ Unknown preset: ${preset}`, 'red');
    log('Run "npm run deploy:quick --help" to see available presets', 'yellow');
    process.exit(1);
  }

  const config = presets[preset];
  
  log(`\n🚀 Running Quick Deploy: ${preset}`, 'cyan');
  log(`📝 ${config.description}`, 'yellow');
  log(`💻 Command: ${config.command}\n`, 'blue');

  try {
    execSync(config.command, { stdio: 'inherit' });
    log(`\n✅ Quick deploy '${preset}' completed successfully!`, 'green');
  } catch (error) {
    log(`\n❌ Quick deploy '${preset}' failed`, 'red');
    process.exit(1);
  }
}

main();