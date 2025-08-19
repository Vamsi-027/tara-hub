#!/usr/bin/env node

/**
 * Modular Deployment System for Tara Hub
 * 
 * Supports iterative deployments of specific components:
 * - Vercel (UI/Frontend)
 * - Railway (Middleware/Backend)
 * - Database migrations only
 * - Environment updates only
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

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}▶ ${msg}${colors.reset}`),
  subheader: (msg) => console.log(`${colors.magenta}  → ${msg}${colors.reset}`)
};

class ModularDeployment {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.deploymentHistory = this.loadDeploymentHistory();
    this.currentDeployment = {
      timestamp: new Date().toISOString(),
      components: [],
      status: 'in_progress'
    };
  }

  async run(args) {
    const command = args[0] || 'help';
    
    const commands = {
      'vercel': () => this.deployVercel(args.slice(1)),
      'railway': () => this.deployRailway(args.slice(1)),
      'database': () => this.deployDatabase(args.slice(1)),
      'env': () => this.updateEnvironment(args.slice(1)),
      'frontend': () => this.deployFrontend(args.slice(1)),
      'backend': () => this.deployBackend(args.slice(1)),
      'middleware': () => this.deployMiddleware(args.slice(1)),
      'rollback': () => this.rollback(args.slice(1)),
      'status': () => this.showStatus(),
      'history': () => this.showHistory(),
      'test': () => this.runComponentTests(args.slice(1)),
      'help': () => this.showHelp()
    };

    if (commands[command]) {
      try {
        await commands[command]();
        this.saveDeploymentHistory();
      } catch (error) {
        log.error(`Deployment failed: ${error.message}`);
        this.currentDeployment.status = 'failed';
        this.saveDeploymentHistory();
        process.exit(1);
      }
    } else {
      log.error(`Unknown command: ${command}`);
      this.showHelp();
    }
  }

  async deployVercel(options) {
    log.header('Deploying Frontend to Vercel');
    
    const deployment = {
      component: 'vercel-frontend',
      startTime: Date.now(),
      options: options
    };

    try {
      // Check for changes in frontend code
      const hasChanges = await this.checkForChanges([
        'app/',
        'components/',
        'lib/',
        'public/',
        'styles/',
        'package.json',
        'next.config.mjs'
      ]);

      if (!hasChanges && !options.includes('--force')) {
        log.info('No frontend changes detected');
        const proceed = await this.ask('Deploy anyway? (y/n)');
        if (proceed !== 'y') {
          log.info('Deployment skipped');
          return;
        }
      }

      // Run frontend-specific tests
      if (!options.includes('--skip-tests')) {
        log.subheader('Running frontend tests...');
        this.exec('npm run lint', { ignoreError: true });
        this.exec('npx tsc --noEmit', { ignoreError: true });
      }

      // Build frontend
      if (!options.includes('--skip-build')) {
        log.subheader('Building frontend...');
        this.exec('npm run build:admin');
        log.success('Frontend built successfully');
      }

      // Deploy to Vercel
      log.subheader('Deploying to Vercel...');
      const isProduction = options.includes('--prod') || options.includes('--production');
      
      if (isProduction) {
        log.info('Deploying to PRODUCTION...');
        const confirm = await this.ask('Confirm production deployment? Type "yes" to continue');
        if (confirm !== 'yes') {
          log.warning('Production deployment cancelled');
          return;
        }
        this.exec('vercel --prod');
        deployment.environment = 'production';
      } else {
        log.info('Deploying to preview...');
        this.exec('vercel');
        deployment.environment = 'preview';
      }

      // Get deployment URL
      const deploymentInfo = this.exec('vercel ls --output json | head -1', { silent: true });
      if (deploymentInfo) {
        try {
          const info = JSON.parse(deploymentInfo);
          deployment.url = info.url;
          log.success(`Deployed to: https://${info.url}`);
        } catch (e) {
          log.warning('Could not parse deployment URL');
        }
      }

      deployment.duration = Date.now() - deployment.startTime;
      deployment.status = 'success';
      this.currentDeployment.components.push(deployment);
      
      log.success('Frontend deployment completed!');
      
      // Run post-deployment health check
      if (!options.includes('--skip-health')) {
        await this.runHealthCheck(deployment.url);
      }

    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error.message;
      this.currentDeployment.components.push(deployment);
      throw error;
    }
  }

  async deployRailway(options) {
    log.header('Deploying Middleware to Railway');
    
    const deployment = {
      component: 'railway-middleware',
      startTime: Date.now(),
      options: options
    };

    try {
      // Check for Railway CLI
      const railwayInstalled = this.exec('railway --version', { 
        ignoreError: true, 
        silent: true 
      });
      
      if (!railwayInstalled) {
        log.error('Railway CLI not installed!');
        log.info('Install with: npm install -g @railway/cli');
        return;
      }

      // Check for middleware changes
      const hasChanges = await this.checkForChanges([
        'middleware/',
        'api/',
        'services/',
        'package.json'
      ]);

      if (!hasChanges && !options.includes('--force')) {
        log.info('No middleware changes detected');
        const proceed = await this.ask('Deploy anyway? (y/n)');
        if (proceed !== 'y') {
          log.info('Deployment skipped');
          return;
        }
      }

      // Run middleware tests
      if (!options.includes('--skip-tests')) {
        log.subheader('Running middleware tests...');
        // Add your middleware-specific tests here
        log.info('Middleware tests placeholder');
      }

      // Deploy to Railway
      log.subheader('Deploying to Railway...');
      const environment = options.includes('--prod') ? 'production' : 'staging';
      
      if (environment === 'production') {
        log.warning('Deploying middleware to PRODUCTION');
        const confirm = await this.ask('Confirm production deployment? Type "yes" to continue');
        if (confirm !== 'yes') {
          log.warning('Production deployment cancelled');
          return;
        }
      }

      // Railway deployment command
      this.exec(`railway up --environment ${environment}`);
      
      deployment.environment = environment;
      deployment.duration = Date.now() - deployment.startTime;
      deployment.status = 'success';
      this.currentDeployment.components.push(deployment);
      
      log.success('Middleware deployment completed!');

      // Get Railway deployment URL
      const railwayStatus = this.exec('railway status --json', { 
        silent: true,
        ignoreError: true 
      });
      
      if (railwayStatus) {
        try {
          const status = JSON.parse(railwayStatus);
          deployment.url = status.url;
          log.info(`Railway URL: ${status.url}`);
        } catch (e) {
          log.info('Railway deployment successful');
        }
      }

    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error.message;
      this.currentDeployment.components.push(deployment);
      throw error;
    }
  }

  async deployDatabase(options) {
    log.header('Database Migration Deployment');
    
    const deployment = {
      component: 'database',
      startTime: Date.now(),
      options: options
    };

    try {
      // Check for schema changes
      const hasChanges = await this.checkForChanges([
        'lib/db/schema/',
        'drizzle/',
        'migrations/',
        'drizzle.config.ts'
      ]);

      if (!hasChanges && !options.includes('--force')) {
        log.info('No database schema changes detected');
        const proceed = await this.ask('Run migrations anyway? (y/n)');
        if (proceed !== 'y') {
          log.info('Migration skipped');
          return;
        }
      }

      // Backup database first (for production)
      if (options.includes('--prod') || options.includes('--production')) {
        log.warning('Production database migration requested');
        const backup = await this.ask('Create database backup first? (y/n)');
        if (backup === 'y') {
          await this.backupDatabase();
        }
      }

      // Generate migrations
      log.subheader('Generating migrations...');
      this.exec('npm run db:generate');
      
      // Show migration preview
      if (!options.includes('--skip-preview')) {
        log.subheader('Migration preview:');
        // Show pending migrations
        const migrationsDir = path.join(this.projectRoot, 'drizzle');
        if (fs.existsSync(migrationsDir)) {
          const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .slice(-3); // Show last 3 migrations
          
          files.forEach(file => {
            log.info(`  - ${file}`);
          });
        }
      }

      // Apply migrations
      const proceed = await this.ask('Apply migrations? (y/n)');
      if (proceed === 'y') {
        log.subheader('Applying migrations...');
        this.exec('npm run db:push');
        deployment.migrationsApplied = true;
        log.success('Migrations applied successfully');
      } else {
        log.info('Migrations skipped');
        deployment.migrationsApplied = false;
      }

      // Seed data if requested
      if (options.includes('--seed')) {
        log.subheader('Seeding data...');
        this.exec('node scripts/seed-data.js --all');
        deployment.dataSeeded = true;
        log.success('Data seeded');
      }

      deployment.duration = Date.now() - deployment.startTime;
      deployment.status = 'success';
      this.currentDeployment.components.push(deployment);
      
      log.success('Database deployment completed!');

    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error.message;
      this.currentDeployment.components.push(deployment);
      throw error;
    }
  }

  async updateEnvironment(options) {
    log.header('Environment Variables Update');
    
    const deployment = {
      component: 'environment',
      startTime: Date.now(),
      options: options
    };

    try {
      // Validate local environment
      log.subheader('Validating local environment...');
      this.exec('node deployment/admin/env-validator.js');

      // Update Vercel environment variables
      if (options.includes('--vercel') || options.includes('--all')) {
        log.subheader('Updating Vercel environment variables...');
        
        // Pull current env from Vercel
        this.exec('vercel env pull .env.vercel');
        
        // Compare with local
        const localEnv = this.loadEnvFile('.env.local');
        const vercelEnv = this.loadEnvFile('.env.vercel');
        
        const differences = this.compareEnvFiles(localEnv, vercelEnv);
        if (differences.length > 0) {
          log.info('Environment differences found:');
          differences.forEach(diff => {
            log.info(`  ${diff.key}: ${diff.status}`);
          });
          
          const update = await this.ask('Push local env to Vercel? (y/n)');
          if (update === 'y') {
            // Update each variable
            Object.entries(localEnv).forEach(([key, value]) => {
              if (key && value) {
                this.exec(`vercel env add ${key} production`, {
                  input: value,
                  ignoreError: true
                });
              }
            });
            log.success('Vercel environment updated');
            deployment.vercelUpdated = true;
          }
        } else {
          log.info('Vercel environment is up to date');
        }
      }

      // Update Railway environment variables
      if (options.includes('--railway') || options.includes('--all')) {
        log.subheader('Updating Railway environment variables...');
        
        const update = await this.ask('Update Railway environment? (y/n)');
        if (update === 'y') {
          // Railway env update
          this.exec('railway variables set', { ignoreError: true });
          log.success('Railway environment updated');
          deployment.railwayUpdated = true;
        }
      }

      deployment.duration = Date.now() - deployment.startTime;
      deployment.status = 'success';
      this.currentDeployment.components.push(deployment);
      
      log.success('Environment update completed!');

    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error.message;
      this.currentDeployment.components.push(deployment);
      throw error;
    }
  }

  async deployFrontend(options) {
    // Alias for Vercel deployment
    return this.deployVercel(options);
  }

  async deployBackend(options) {
    // Deploy both middleware and database
    log.header('Full Backend Deployment');
    
    await this.deployDatabase(options);
    await this.deployMiddleware(options);
  }

  async deployMiddleware(options) {
    // Alias for Railway deployment
    return this.deployRailway(options);
  }

  async rollback(options) {
    log.header('Rollback Deployment');
    
    const component = options[0];
    
    if (!component) {
      log.error('Please specify component to rollback: vercel, railway, or database');
      return;
    }

    switch(component) {
      case 'vercel':
      case 'frontend':
        log.subheader('Rolling back Vercel deployment...');
        const vercelDeployments = this.exec('vercel ls --output json', { silent: true });
        if (vercelDeployments) {
          const deployments = JSON.parse(vercelDeployments);
          log.info('Recent deployments:');
          deployments.slice(0, 5).forEach((d, i) => {
            log.info(`  ${i + 1}. ${d.url} (${d.created})`);
          });
          
          const choice = await this.ask('Select deployment number to rollback to');
          const selected = deployments[parseInt(choice) - 1];
          if (selected) {
            this.exec(`vercel rollback ${selected.url}`);
            log.success('Rollback completed');
          }
        }
        break;

      case 'railway':
      case 'middleware':
        log.subheader('Rolling back Railway deployment...');
        log.info('Use Railway dashboard for rollback');
        log.info('https://railway.app/dashboard');
        break;

      case 'database':
        log.subheader('Database rollback...');
        log.warning('Manual database restoration required');
        log.info('1. Restore from backup');
        log.info('2. Run previous migration version');
        break;

      default:
        log.error(`Unknown component: ${component}`);
    }
  }

  async runComponentTests(components) {
    log.header('Component Testing');
    
    const testSuites = {
      'frontend': async () => {
        log.subheader('Testing frontend...');
        this.exec('npm run lint', { ignoreError: true });
        this.exec('npx tsc --noEmit', { ignoreError: true });
        this.exec('npm run test', { ignoreError: true });
      },
      'backend': async () => {
        log.subheader('Testing backend...');
        this.exec('npm run test:api', { ignoreError: true });
      },
      'database': async () => {
        log.subheader('Testing database connection...');
        this.exec('node deployment/admin/pre-deploy-test.js', { ignoreError: true });
      },
      'all': async () => {
        await testSuites.frontend();
        await testSuites.backend();
        await testSuites.database();
      }
    };

    const component = components[0] || 'all';
    if (testSuites[component]) {
      await testSuites[component]();
      log.success('Tests completed');
    } else {
      log.error(`Unknown test suite: ${component}`);
    }
  }

  async checkForChanges(paths) {
    try {
      let hasChanges = false;
      
      paths.forEach(path => {
        const fullPath = path.startsWith('/') ? path : `${this.projectRoot}/${path}`;
        if (fs.existsSync(fullPath)) {
          const gitStatus = this.exec(`git status --porcelain ${path}`, { 
            silent: true,
            ignoreError: true 
          });
          if (gitStatus && gitStatus.trim()) {
            hasChanges = true;
          }
        }
      });
      
      // Also check for uncommitted changes in the last commit
      const lastCommit = this.exec('git log -1 --name-only --pretty=format:', { 
        silent: true 
      });
      
      if (lastCommit) {
        paths.forEach(path => {
          if (lastCommit.includes(path)) {
            hasChanges = true;
          }
        });
      }
      
      return hasChanges;
    } catch {
      return true; // Assume changes if can't determine
    }
  }

  async backupDatabase() {
    log.subheader('Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    
    // This is a placeholder - implement based on your database
    log.info(`Backup would be saved to: ${backupFile}`);
    log.warning('Implement database backup based on your provider (Neon/Supabase)');
    
    // For Neon, you might use their API
    // For local PostgreSQL: pg_dump DATABASE_URL > backup.sql
  }

  async runHealthCheck(url) {
    log.subheader('Running health check...');
    
    if (!url) {
      log.warning('No URL provided for health check');
      return;
    }
    
    try {
      const healthUrl = `https://${url}/api/health`;
      const response = this.exec(`curl -s -o /dev/null -w "%{http_code}" ${healthUrl}`, {
        silent: true,
        ignoreError: true
      });
      
      if (response === '200') {
        log.success('Health check passed');
      } else {
        log.warning(`Health check returned: ${response}`);
      }
    } catch (error) {
      log.warning('Health check failed');
    }
  }

  loadEnvFile(filename) {
    const envPath = path.join(this.projectRoot, filename);
    if (!fs.existsSync(envPath)) return {};
    
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  }

  compareEnvFiles(local, remote) {
    const differences = [];
    
    // Check for new or changed variables
    Object.keys(local).forEach(key => {
      if (!remote[key]) {
        differences.push({ key, status: 'new' });
      } else if (local[key] !== remote[key]) {
        differences.push({ key, status: 'changed' });
      }
    });
    
    // Check for removed variables
    Object.keys(remote).forEach(key => {
      if (!local[key]) {
        differences.push({ key, status: 'removed' });
      }
    });
    
    return differences;
  }

  showStatus() {
    log.header('Deployment Status');
    
    // Show current Git status
    log.subheader('Git Status:');
    this.exec('git status --short');
    
    // Show last deployment
    if (this.deploymentHistory.length > 0) {
      const last = this.deploymentHistory[this.deploymentHistory.length - 1];
      log.subheader('Last Deployment:');
      log.info(`  Timestamp: ${last.timestamp}`);
      log.info(`  Components: ${last.components.map(c => c.component).join(', ')}`);
      log.info(`  Status: ${last.status}`);
    }
    
    // Check service status
    log.subheader('Service Status:');
    
    // Vercel status
    const vercelStatus = this.exec('vercel ls --output json | head -1', { 
      silent: true,
      ignoreError: true 
    });
    if (vercelStatus) {
      try {
        const deployment = JSON.parse(vercelStatus);
        log.info(`  Vercel: https://${deployment.url} (${deployment.state})`);
      } catch {
        log.info('  Vercel: Unable to get status');
      }
    }
    
    // Railway status
    const railwayStatus = this.exec('railway status', { 
      silent: true,
      ignoreError: true 
    });
    if (railwayStatus) {
      log.info(`  Railway: ${railwayStatus.trim()}`);
    } else {
      log.info('  Railway: Not configured or offline');
    }
  }

  showHistory() {
    log.header('Deployment History');
    
    if (this.deploymentHistory.length === 0) {
      log.info('No deployment history found');
      return;
    }
    
    this.deploymentHistory.slice(-10).reverse().forEach((deployment, index) => {
      console.log(`\n${index + 1}. ${deployment.timestamp}`);
      console.log(`   Status: ${deployment.status}`);
      deployment.components.forEach(component => {
        const duration = component.duration ? 
          ` (${(component.duration / 1000).toFixed(2)}s)` : '';
        console.log(`   - ${component.component}: ${component.status}${duration}`);
        if (component.url) {
          console.log(`     URL: ${component.url}`);
        }
      });
    });
  }

  loadDeploymentHistory() {
    const historyFile = path.join(this.projectRoot, '.deployment-history.json');
    if (fs.existsSync(historyFile)) {
      try {
        return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      } catch {
        return [];
      }
    }
    return [];
  }

  saveDeploymentHistory() {
    if (this.currentDeployment.components.length > 0) {
      this.currentDeployment.status = 'completed';
      this.deploymentHistory.push(this.currentDeployment);
      
      // Keep only last 50 deployments
      if (this.deploymentHistory.length > 50) {
        this.deploymentHistory = this.deploymentHistory.slice(-50);
      }
      
      const historyFile = path.join(this.projectRoot, '.deployment-history.json');
      fs.writeFileSync(
        historyFile,
        JSON.stringify(this.deploymentHistory, null, 2)
      );
    }
  }

  exec(command, options = {}) {
    try {
      const result = execSync(command, {
        cwd: this.projectRoot,
        stdio: options.silent ? 'pipe' : 'inherit',
        encoding: 'utf8',
        ...options
      });
      return result;
    } catch (error) {
      if (!options.ignoreError) {
        throw error;
      }
      return null;
    }
  }

  async ask(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(`${colors.cyan}?${colors.reset} ${question}: `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase());
      });
    });
  }

  showHelp() {
    console.log(`
${colors.bright}Tara Hub - Modular Deployment System${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node deploy-modular.js <command> [options]

${colors.cyan}Commands:${colors.reset}
  ${colors.green}vercel${colors.reset}     Deploy frontend to Vercel
  ${colors.green}railway${colors.reset}    Deploy middleware to Railway  
  ${colors.green}database${colors.reset}   Run database migrations
  ${colors.green}env${colors.reset}        Update environment variables
  ${colors.green}frontend${colors.reset}   Alias for 'vercel'
  ${colors.green}backend${colors.reset}    Deploy database + middleware
  ${colors.green}rollback${colors.reset}   Rollback a deployment
  ${colors.green}status${colors.reset}     Show deployment status
  ${colors.green}history${colors.reset}    Show deployment history
  ${colors.green}test${colors.reset}       Run component tests
  ${colors.green}help${colors.reset}       Show this help

${colors.cyan}Options:${colors.reset}
  --prod, --production   Deploy to production
  --force               Force deployment even without changes
  --skip-tests          Skip running tests
  --skip-build          Skip build step
  --skip-health         Skip health check
  --seed                Seed data after database migration

${colors.cyan}Examples:${colors.reset}
  # Deploy only frontend to preview
  node deploy-modular.js vercel

  # Deploy frontend to production
  node deploy-modular.js vercel --prod

  # Deploy only database changes
  node deploy-modular.js database

  # Deploy middleware to Railway
  node deploy-modular.js railway --prod

  # Update environment variables
  node deploy-modular.js env --vercel --railway

  # Rollback frontend
  node deploy-modular.js rollback vercel

  # Check deployment status
  node deploy-modular.js status

${colors.cyan}Quick Deployments:${colors.reset}
  # Frontend hotfix
  node deploy-modular.js vercel --skip-tests --prod

  # Database migration only
  node deploy-modular.js database --prod

  # Full backend deployment
  node deploy-modular.js backend --prod
    `);
  }
}

// CLI execution
if (require.main === module) {
  const deployer = new ModularDeployment();
  const args = process.argv.slice(2);
  
  deployer.run(args).catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = ModularDeployment;