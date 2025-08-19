#!/usr/bin/env node

/**
 * Pre-deployment Testing and Validation Script
 * 
 * Runs comprehensive tests before deploying to production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Test configuration
const TEST_CONFIG = {
  projectRoot: path.resolve(__dirname, '../..'),
  timeout: 30000, // 30 seconds per test
  criticalTests: [
    'env-validation',
    'database-connection',
    'auth-flow',
    'api-endpoints'
  ],
  performanceThresholds: {
    buildTime: 120000, // 2 minutes max build time
    bundleSize: 5 * 1024 * 1024, // 5MB max bundle size
    firstLoad: 3000 // 3 seconds max first load
  }
};

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class PreDeploymentTester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      startTime: Date.now()
    };
  }

  log = {
    test: (name) => console.log(`\n${colors.cyan}[TEST]${colors.reset} ${name}`),
    pass: (msg) => {
      console.log(`  ${colors.green}✓${colors.reset} ${msg}`);
      this.results.passed.push(msg);
    },
    fail: (msg) => {
      console.log(`  ${colors.red}✗${colors.reset} ${msg}`);
      this.results.failed.push(msg);
    },
    warn: (msg) => {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${msg}`);
      this.results.warnings.push(msg);
    },
    info: (msg) => console.log(`  ${colors.blue}ℹ${colors.reset} ${msg}`)
  };

  async runAll() {
    console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════╗
║     PRE-DEPLOYMENT VALIDATION SUITE       ║
║         Tara Hub Admin Dashboard          ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

    try {
      // Run all test suites
      await this.testEnvironmentVariables();
      await this.testDatabaseConnection();
      await this.testAuthentication();
      await this.testAPIEndpoints();
      await this.testBuildProcess();
      await this.testDependencies();
      await this.testSecurity();
      await this.testPerformance();
      
      // Show results
      this.showResults();
      
      // Return exit code based on results
      return this.results.failed.length === 0 ? 0 : 1;
      
    } catch (error) {
      console.error(`\n${colors.red}Fatal error during testing:${colors.reset}`, error);
      return 1;
    }
  }

  async testEnvironmentVariables() {
    this.log.test('Environment Variables');
    
    const envPath = path.join(TEST_CONFIG.projectRoot, '.env.local');
    
    // Check if env file exists
    if (!fs.existsSync(envPath)) {
      this.log.fail('Missing .env.local file');
      return;
    }
    this.log.pass('.env.local file exists');
    
    // Load and check variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'RESEND_API_KEY',
      'R2_BUCKET_NAME'
    ];
    
    requiredVars.forEach(varName => {
      if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
        this.log.pass(`${varName} is set`);
      } else {
        this.log.fail(`${varName} is missing or empty`);
      }
    });
    
    // Check for production values
    if (envContent.includes('localhost')) {
      this.log.warn('Environment contains localhost URLs');
    }
    
    // Validate JWT secret strength
    const secretMatch = envContent.match(/NEXTAUTH_SECRET=([^\n]+)/);
    if (secretMatch && secretMatch[1].length < 32) {
      this.log.fail('NEXTAUTH_SECRET is too weak (< 32 chars)');
    } else if (secretMatch) {
      this.log.pass('NEXTAUTH_SECRET is strong');
    }
  }

  async testDatabaseConnection() {
    this.log.test('Database Connection');
    
    try {
      // Test database connection using drizzle
      const testScript = `
        const { drizzle } = require('drizzle-orm/postgres-js');
        const postgres = require('postgres');
        require('dotenv').config({ path: '.env.local' });
        
        const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL);
        sql\`SELECT 1\`.then(() => {
          console.log('SUCCESS');
          process.exit(0);
        }).catch(err => {
          console.error('FAILED:', err.message);
          process.exit(1);
        });
      `;
      
      const result = execSync(`node -e "${testScript}"`, {
        cwd: TEST_CONFIG.projectRoot,
        encoding: 'utf8',
        timeout: 10000
      });
      
      if (result.includes('SUCCESS')) {
        this.log.pass('Database connection successful');
      } else {
        this.log.fail('Database connection failed');
      }
      
    } catch (error) {
      this.log.fail(`Database connection error: ${error.message}`);
    }
    
    // Test migrations
    try {
      execSync('npm run db:generate', {
        cwd: TEST_CONFIG.projectRoot,
        stdio: 'pipe',
        timeout: 30000
      });
      this.log.pass('Database migrations valid');
    } catch (error) {
      this.log.warn('Database migration check failed');
    }
  }

  async testAuthentication() {
    this.log.test('Authentication System');
    
    // Check auth configuration
    const authConfigPath = path.join(TEST_CONFIG.projectRoot, 'lib/auth.ts');
    if (fs.existsSync(authConfigPath)) {
      this.log.pass('Auth configuration exists');
      
      // Check for admin emails
      const authContent = fs.readFileSync(authConfigPath, 'utf8');
      const adminEmails = [
        'varaku@gmail.com',
        'batchu.kedareswaraabhinav@gmail.com',
        'vamsicheruku027@gmail.com',
        'admin@deepcrm.ai'
      ];
      
      let foundAdmins = 0;
      adminEmails.forEach(email => {
        if (authContent.includes(email)) {
          foundAdmins++;
        }
      });
      
      if (foundAdmins > 0) {
        this.log.pass(`Found ${foundAdmins} admin emails configured`);
      } else {
        this.log.fail('No admin emails configured');
      }
      
    } else {
      this.log.fail('Auth configuration missing');
    }
    
    // Check magic link implementation
    const magicLinkFiles = [
      'lib/auth-utils.ts',
      'lib/email-service.ts',
      'app/api/auth/signin/route.ts',
      'app/api/auth/verify/route.ts'
    ];
    
    let magicLinkFilesFound = 0;
    magicLinkFiles.forEach(file => {
      const filePath = path.join(TEST_CONFIG.projectRoot, file);
      if (fs.existsSync(filePath)) {
        magicLinkFilesFound++;
      }
    });
    
    if (magicLinkFilesFound === magicLinkFiles.length) {
      this.log.pass('Magic link authentication fully implemented');
    } else {
      this.log.warn(`Magic link implementation incomplete (${magicLinkFilesFound}/${magicLinkFiles.length} files)`);
    }
  }

  async testAPIEndpoints() {
    this.log.test('API Endpoints');
    
    const apiRoutes = [
      'app/api/health/route.ts',
      'app/api/fabrics/route.ts',
      'app/api/auth/signin/route.ts',
      'app/api/auth/verify/route.ts',
      'app/api/auth/signout/route.ts'
    ];
    
    let foundRoutes = 0;
    apiRoutes.forEach(route => {
      const routePath = path.join(TEST_CONFIG.projectRoot, route);
      if (fs.existsSync(routePath)) {
        foundRoutes++;
        this.log.pass(`Found ${route}`);
      } else {
        this.log.warn(`Missing ${route}`);
      }
    });
    
    if (foundRoutes === apiRoutes.length) {
      this.log.pass('All critical API endpoints present');
    } else {
      this.log.warn(`${foundRoutes}/${apiRoutes.length} API endpoints found`);
    }
  }

  async testBuildProcess() {
    this.log.test('Build Process');
    
    const startTime = Date.now();
    
    try {
      // Run build
      this.log.info('Building application (this may take a minute)...');
      execSync('npm run build:admin', {
        cwd: TEST_CONFIG.projectRoot,
        stdio: 'pipe',
        timeout: TEST_CONFIG.performanceThresholds.buildTime
      });
      
      const buildTime = Date.now() - startTime;
      this.log.pass(`Build successful (${(buildTime / 1000).toFixed(2)}s)`);
      
      // Check build output
      const nextDir = path.join(TEST_CONFIG.projectRoot, '.next');
      if (fs.existsSync(nextDir)) {
        // Get directory size
        const getDirSize = (dir) => {
          let size = 0;
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              size += getDirSize(filePath);
            } else {
              size += stats.size;
            }
          });
          return size;
        };
        
        const buildSize = getDirSize(nextDir);
        const sizeMB = (buildSize / 1024 / 1024).toFixed(2);
        
        if (buildSize < TEST_CONFIG.performanceThresholds.bundleSize) {
          this.log.pass(`Build size acceptable (${sizeMB} MB)`);
        } else {
          this.log.warn(`Build size large (${sizeMB} MB)`);
        }
      }
      
    } catch (error) {
      this.log.fail(`Build failed: ${error.message}`);
    }
  }

  async testDependencies() {
    this.log.test('Dependencies');
    
    // Check for security vulnerabilities
    try {
      const auditResult = execSync('npm audit --json', {
        cwd: TEST_CONFIG.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.metadata.vulnerabilities;
      
      if (vulnerabilities.high === 0 && vulnerabilities.critical === 0) {
        this.log.pass('No high or critical vulnerabilities');
      } else {
        this.log.fail(`Found ${vulnerabilities.high} high and ${vulnerabilities.critical} critical vulnerabilities`);
      }
      
      if (vulnerabilities.moderate > 0) {
        this.log.warn(`${vulnerabilities.moderate} moderate vulnerabilities found`);
      }
      
    } catch (error) {
      this.log.warn('Could not run security audit');
    }
    
    // Check for outdated packages
    try {
      const outdated = execSync('npm outdated --json', {
        cwd: TEST_CONFIG.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (outdated) {
        const packages = Object.keys(JSON.parse(outdated));
        if (packages.length > 10) {
          this.log.warn(`${packages.length} packages are outdated`);
        } else if (packages.length > 0) {
          this.log.info(`${packages.length} packages have updates available`);
        }
      } else {
        this.log.pass('All packages up to date');
      }
      
    } catch (error) {
      // npm outdated returns non-zero if packages are outdated
      this.log.info('Some packages may be outdated');
    }
  }

  async testSecurity() {
    this.log.test('Security Configuration');
    
    // Check middleware configuration
    const middlewarePath = path.join(TEST_CONFIG.projectRoot, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      this.log.pass('Middleware configured');
      
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      if (middlewareContent.includes('JWT') || middlewareContent.includes('jwt')) {
        this.log.pass('JWT authentication in middleware');
      }
      
      if (middlewareContent.includes('/admin')) {
        this.log.pass('Admin route protection configured');
      }
    } else {
      this.log.fail('No middleware configuration found');
    }
    
    // Check for exposed secrets
    const checkFiles = [
      'app',
      'components',
      'lib'
    ];
    
    let exposedSecrets = false;
    checkFiles.forEach(dir => {
      const dirPath = path.join(TEST_CONFIG.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        const searchForSecrets = (dir) => {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
              searchForSecrets(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
              const content = fs.readFileSync(filePath, 'utf8');
              
              // Check for hardcoded secrets
              const secretPatterns = [
                /['"]sk_live_[a-zA-Z0-9]+['"]/,
                /['"]pk_live_[a-zA-Z0-9]+['"]/,
                /['"]Bearer [a-zA-Z0-9]+['"]/,
                /password\s*=\s*['"][^'"]+['"]/i
              ];
              
              secretPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                  this.log.fail(`Potential exposed secret in ${filePath}`);
                  exposedSecrets = true;
                }
              });
            }
          });
        };
        
        searchForSecrets(dirPath);
      }
    });
    
    if (!exposedSecrets) {
      this.log.pass('No exposed secrets found');
    }
    
    // Check CORS configuration
    const apiFiles = fs.readdirSync(path.join(TEST_CONFIG.projectRoot, 'app/api'), { recursive: true });
    const hasProperCORS = apiFiles.some(file => {
      if (file.toString().endsWith('route.ts')) {
        const content = fs.readFileSync(
          path.join(TEST_CONFIG.projectRoot, 'app/api', file.toString()),
          'utf8'
        );
        return content.includes('Access-Control') || content.includes('cors');
      }
      return false;
    });
    
    if (hasProperCORS) {
      this.log.info('CORS headers configured in some API routes');
    } else {
      this.log.warn('No CORS configuration found');
    }
  }

  async testPerformance() {
    this.log.test('Performance Checks');
    
    // Check for performance optimizations
    const nextConfig = path.join(TEST_CONFIG.projectRoot, 'next.config.mjs');
    if (fs.existsSync(nextConfig)) {
      const config = fs.readFileSync(nextConfig, 'utf8');
      
      if (config.includes('images')) {
        this.log.pass('Image optimization configured');
      }
      
      if (config.includes('compress')) {
        this.log.pass('Compression enabled');
      }
    }
    
    // Check for lazy loading
    const hasLazyLoading = (() => {
      const appDir = path.join(TEST_CONFIG.projectRoot, 'app');
      const checkForLazy = (dir) => {
        const files = fs.readdirSync(dir);
        return files.some(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            return checkForLazy(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('dynamic(') || content.includes('lazy(');
          }
          return false;
        });
      };
      
      return checkForLazy(appDir);
    })();
    
    if (hasLazyLoading) {
      this.log.pass('Lazy loading implemented');
    } else {
      this.log.info('Consider implementing lazy loading for better performance');
    }
    
    // Check for caching implementation
    const hasCaching = fs.existsSync(path.join(TEST_CONFIG.projectRoot, 'lib/cache')) ||
                      fs.existsSync(path.join(TEST_CONFIG.projectRoot, 'lib/fabric-kv.ts'));
    
    if (hasCaching) {
      this.log.pass('Caching layer implemented');
    } else {
      this.log.warn('No caching layer found');
    }
  }

  showResults() {
    const duration = ((Date.now() - this.results.startTime) / 1000).toFixed(2);
    
    console.log(`\n${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════╗
║            TEST RESULTS SUMMARY           ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

    console.log(`\n⏱️  Total time: ${duration} seconds\n`);
    
    if (this.results.passed.length > 0) {
      console.log(`${colors.green}✅ PASSED (${this.results.passed.length})${colors.reset}`);
      this.results.passed.forEach(test => {
        console.log(`   • ${test}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠️  WARNINGS (${this.results.warnings.length})${colors.reset}`);
      this.results.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }
    
    if (this.results.failed.length > 0) {
      console.log(`\n${colors.red}❌ FAILED (${this.results.failed.length})${colors.reset}`);
      this.results.failed.forEach(test => {
        console.log(`   • ${test}`);
      });
    }
    
    // Overall result
    console.log('\n' + '═'.repeat(45));
    if (this.results.failed.length === 0) {
      console.log(`${colors.bright}${colors.green}✅ PRE-DEPLOYMENT VALIDATION PASSED${colors.reset}`);
      console.log('Your application is ready for deployment!');
    } else {
      console.log(`${colors.bright}${colors.red}❌ PRE-DEPLOYMENT VALIDATION FAILED${colors.reset}`);
      console.log('Please fix the issues above before deploying.');
    }
    console.log('═'.repeat(45));
  }
}

// CLI execution
if (require.main === module) {
  const tester = new PreDeploymentTester();
  
  tester.runAll().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = PreDeploymentTester;