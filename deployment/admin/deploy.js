#!/usr/bin/env node

/**
 * Tara Hub Admin - Production Deployment Script
 * 
 * This script handles the complete deployment process for the admin app
 * including environment validation, testing, building, and deployment to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Deployment configuration
const config = {
  appName: 'Tara Hub Admin',
  projectPath: path.resolve(__dirname, '../..'),
  adminPath: path.resolve(__dirname, '../../app/admin'),
  requiredEnvVars: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME'
  ],
  optionalEnvVars: [
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}▶ ${msg}${colors.reset}`),
  subheader: (msg) => console.log(`${colors.magenta}  → ${msg}${colors.reset}`)
};

const exec = (command, options = {}) => {
  try {
    log.subheader(`Running: ${command}`);
    const result = execSync(command, {
      cwd: config.projectPath,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      log.error(`Command failed: ${command}`);
      throw error;
    }
    return null;
  }
};

const askQuestion = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}?${colors.reset} ${question} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
};

// Deployment steps
class DeploymentManager {
  constructor() {
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    try {
      log.header(`Starting deployment for ${config.appName}`);
      log.info(`Timestamp: ${new Date().toISOString()}`);
      
      // Step 1: Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Step 2: Environment validation
      await this.validateEnvironment();
      
      // Step 3: Dependencies check
      await this.checkDependencies();
      
      // Step 4: Run tests
      await this.runTests();
      
      // Step 5: Build application
      await this.buildApplication();
      
      // Step 6: Database migrations
      await this.runDatabaseMigrations();
      
      // Step 7: Deploy to Vercel
      await this.deployToVercel();
      
      // Step 8: Post-deployment verification
      await this.postDeploymentVerification();
      
      // Step 9: Summary
      this.showSummary();
      
    } catch (error) {
      log.error('Deployment failed!');
      console.error(error);
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    log.header('Pre-deployment Checks');
    
    // Check Git status
    log.subheader('Checking Git status...');
    const gitStatus = exec('git status --porcelain', { silent: true });
    if (gitStatus && gitStatus.trim()) {
      log.warning('You have uncommitted changes:');
      console.log(gitStatus);
      const proceed = await askQuestion('Continue with deployment? (y/n)');
      if (proceed !== 'y') {
        log.info('Deployment cancelled');
        process.exit(0);
      }
    } else {
      log.success('Git working directory clean');
    }
    
    // Check current branch
    const branch = exec('git branch --show-current', { silent: true }).trim();
    log.info(`Current branch: ${branch}`);
    if (branch !== 'main') {
      log.warning(`You're not on the main branch (current: ${branch})`);
      const proceed = await askQuestion('Deploy from non-main branch? (y/n)');
      if (proceed !== 'y') {
        log.info('Deployment cancelled');
        process.exit(0);
      }
    }
  }

  async validateEnvironment() {
    log.header('Environment Validation');
    
    // Check for .env.local file
    const envPath = path.join(config.projectPath, '.env.local');
    if (!fs.existsSync(envPath)) {
      log.error('.env.local file not found!');
      log.info('Please create .env.local from .env.example');
      process.exit(1);
    }
    
    // Load and validate environment variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });
    
    // Check required variables
    log.subheader('Checking required environment variables...');
    let hasErrors = false;
    config.requiredEnvVars.forEach(varName => {
      if (!envVars[varName] || envVars[varName] === '') {
        log.error(`Missing required: ${varName}`);
        hasErrors = true;
      } else {
        log.success(`Found: ${varName}`);
      }
    });
    
    // Check optional variables
    log.subheader('Checking optional environment variables...');
    config.optionalEnvVars.forEach(varName => {
      if (!envVars[varName] || envVars[varName] === '') {
        log.warning(`Missing optional: ${varName}`);
        this.warnings.push(`Optional env var missing: ${varName}`);
      } else {
        log.success(`Found: ${varName}`);
      }
    });
    
    if (hasErrors) {
      log.error('Required environment variables are missing!');
      process.exit(1);
    }
    
    // Validate specific configurations
    this.validateSpecificConfigs(envVars);
  }

  validateSpecificConfigs(envVars) {
    log.subheader('Validating configuration values...');
    
    // Validate database URL
    if (envVars.DATABASE_URL && !envVars.DATABASE_URL.startsWith('postgresql://')) {
      log.error('DATABASE_URL must be a PostgreSQL connection string');
      process.exit(1);
    }
    
    // Validate NextAuth URL
    if (envVars.NEXTAUTH_URL) {
      try {
        new URL(envVars.NEXTAUTH_URL);
        log.success('NEXTAUTH_URL is valid');
      } catch {
        log.error('NEXTAUTH_URL is not a valid URL');
        process.exit(1);
      }
    }
    
    // Check for production URL
    if (envVars.NEXTAUTH_URL && envVars.NEXTAUTH_URL.includes('localhost')) {
      log.warning('NEXTAUTH_URL contains localhost - update for production!');
      this.warnings.push('NEXTAUTH_URL contains localhost');
    }
  }

  async checkDependencies() {
    log.header('Dependencies Check');
    
    // Check Node version
    log.subheader('Checking Node.js version...');
    const nodeVersion = process.version;
    log.info(`Node.js version: ${nodeVersion}`);
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      log.error('Node.js 18 or higher is required!');
      process.exit(1);
    }
    
    // Install/update dependencies
    log.subheader('Installing dependencies...');
    exec('npm ci --prefer-offline --no-audit');
    log.success('Dependencies installed');
    
    // Check for vulnerabilities
    log.subheader('Checking for vulnerabilities...');
    const auditResult = exec('npm audit --audit-level=high', { 
      ignoreError: true, 
      silent: true 
    });
    if (auditResult && auditResult.includes('found 0 vulnerabilities')) {
      log.success('No high severity vulnerabilities found');
    } else {
      log.warning('Some vulnerabilities detected - review npm audit');
      this.warnings.push('npm audit found vulnerabilities');
    }
  }

  async runTests() {
    log.header('Running Tests');
    
    // Run linting
    log.subheader('Running ESLint...');
    const lintResult = exec('npm run lint', { ignoreError: true });
    if (lintResult === null) {
      log.warning('Linting failed - review errors');
      this.warnings.push('ESLint reported errors');
    } else {
      log.success('Linting passed');
    }
    
    // Run type checking
    log.subheader('Running TypeScript type check...');
    const typeCheckResult = exec('npx tsc --noEmit', { ignoreError: true });
    if (typeCheckResult === null) {
      log.warning('Type checking failed - review errors');
      this.warnings.push('TypeScript type errors found');
    } else {
      log.success('Type checking passed');
    }
    
    // Run unit tests if available
    if (fs.existsSync(path.join(config.projectPath, 'vitest.config.ts'))) {
      log.subheader('Running unit tests...');
      const testResult = exec('npm run test:unit', { ignoreError: true });
      if (testResult === null) {
        log.warning('Some tests failed');
        this.warnings.push('Unit tests failed');
      } else {
        log.success('All tests passed');
      }
    } else {
      log.info('No unit tests configured');
    }
  }

  async buildApplication() {
    log.header('Building Application');
    
    // Clean previous build
    log.subheader('Cleaning previous build...');
    const nextPath = path.join(config.projectPath, '.next');
    if (fs.existsSync(nextPath)) {
      fs.rmSync(nextPath, { recursive: true, force: true });
      log.success('Previous build cleaned');
    }
    
    // Build the application
    log.subheader('Building admin application...');
    exec('npm run build:admin');
    log.success('Application built successfully');
    
    // Check build output
    if (fs.existsSync(nextPath)) {
      const stats = fs.statSync(nextPath);
      log.info(`Build size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  async runDatabaseMigrations() {
    log.header('Database Migrations');
    
    const proceed = await askQuestion('Run database migrations? (y/n)');
    if (proceed !== 'y') {
      log.info('Skipping database migrations');
      return;
    }
    
    // Generate migrations
    log.subheader('Generating migrations...');
    exec('npm run db:generate');
    log.success('Migrations generated');
    
    // Apply migrations
    log.subheader('Applying migrations...');
    exec('npm run db:push');
    log.success('Migrations applied');
    
    // Seed data (optional)
    const seedData = await askQuestion('Seed initial data? (y/n)');
    if (seedData === 'y') {
      log.subheader('Seeding data...');
      exec('node scripts/seed-data.js', { ignoreError: true });
      log.success('Data seeded');
    }
  }

  async deployToVercel() {
    log.header('Deploying to Vercel');
    
    // Check if Vercel CLI is installed
    log.subheader('Checking Vercel CLI...');
    const vercelInstalled = exec('vercel --version', { 
      ignoreError: true, 
      silent: true 
    });
    
    if (!vercelInstalled) {
      log.error('Vercel CLI not installed!');
      log.info('Install with: npm i -g vercel');
      process.exit(1);
    }
    
    // Deploy to Vercel
    log.subheader('Deploying to Vercel...');
    const deployEnv = await askQuestion('Deploy to production? (y/n)');
    
    if (deployEnv === 'y') {
      log.info('Deploying to production...');
      exec('vercel --prod');
      log.success('Deployed to production!');
    } else {
      log.info('Deploying to preview...');
      exec('vercel');
      log.success('Deployed to preview!');
    }
  }

  async postDeploymentVerification() {
    log.header('Post-deployment Verification');
    
    // Get deployment URL
    log.subheader('Getting deployment URL...');
    const deploymentUrl = exec('vercel ls --output json | head -1', { 
      silent: true,
      ignoreError: true 
    });
    
    if (deploymentUrl) {
      try {
        const deployment = JSON.parse(deploymentUrl);
        log.info(`Deployment URL: ${deployment.url}`);
        
        // Health check
        log.subheader('Running health check...');
        const healthCheck = exec(`curl -s -o /dev/null -w "%{http_code}" https://${deployment.url}/api/health`, {
          silent: true,
          ignoreError: true
        });
        
        if (healthCheck === '200') {
          log.success('Health check passed');
        } else {
          log.warning('Health check failed or not configured');
          this.warnings.push('Health check endpoint not responding');
        }
      } catch (e) {
        log.warning('Could not parse deployment info');
      }
    }
  }

  showSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    log.header('Deployment Summary');
    log.info(`Total time: ${duration} seconds`);
    
    if (this.warnings.length > 0) {
      log.warning(`Warnings (${this.warnings.length}):`);
      this.warnings.forEach(w => console.log(`  - ${w}`));
    }
    
    if (this.errors.length > 0) {
      log.error(`Errors (${this.errors.length}):`);
      this.errors.forEach(e => console.log(`  - ${e}`));
    } else {
      log.success('Deployment completed successfully!');
    }
    
    // Next steps
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    console.log('1. Verify the deployment at your production URL');
    console.log('2. Test authentication flow');
    console.log('3. Check database connectivity');
    console.log('4. Monitor error logs in Vercel dashboard');
    console.log('5. Set up monitoring and alerts');
  }
}

// Main execution
if (require.main === module) {
  const deployment = new DeploymentManager();
  deployment.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DeploymentManager;