#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Environment variable categories
const ENV_CATEGORIES = {
  auth: {
    name: 'Authentication',
    vars: [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ]
  },
  database: {
    name: 'Database (PostgreSQL)',
    vars: [
      'DATABASE_URL',
      'POSTGRES_URL',
      'POSTGRES_URL_NON_POOLING',
      'POSTGRES_USER',
      'POSTGRES_HOST',
      'POSTGRES_PASSWORD',
      'POSTGRES_DATABASE'
    ]
  },
  redis: {
    name: 'Redis/KV Cache',
    vars: [
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
      'KV_REST_API_READ_ONLY_TOKEN',
      'KV_URL',
      'REDIS_URL',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ]
  },
  email: {
    name: 'Email Service (Resend)',
    vars: [
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL',
      'EMAIL_SERVER_USER',
      'EMAIL_SERVER_PASSWORD',
      'EMAIL_SERVER_HOST',
      'EMAIL_SERVER_PORT',
      'EMAIL_FROM'
    ]
  },
  storage: {
    name: 'Cloudflare R2 Storage',
    vars: [
      'R2_BUCKET',
      'S3_URL',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_ACCOUNT_ID'
    ]
  },
  stackAuth: {
    name: 'Stack Auth (Optional)',
    vars: [
      'NEXT_PUBLIC_STACK_PROJECT_ID',
      'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
      'STACK_SECRET_SERVER_KEY'
    ]
  }
};

// Apps and their required environment variables
const APP_ENV_REQUIREMENTS = {
  admin: {
    name: 'Admin Dashboard',
    required: ['auth', 'database', 'redis', 'email', 'storage'],
    optional: ['stackAuth']
  },
  'fabric-store': {
    name: 'Fabric Store',
    required: ['database', 'redis'],
    optional: ['auth']
  },
  'store-guide': {
    name: 'Store Guide',
    required: ['database'],
    optional: ['redis']
  }
};

class EnvManager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../..');
    this.envPath = path.join(this.rootDir, '.env.local');
    this.envTemplateDir = path.join(__dirname, '../configs/env-templates');
    this.envVars = {};
  }

  // Load environment variables from .env.local
  loadEnvFile() {
    if (!fs.existsSync(this.envPath)) {
      console.log('⚠️  No .env.local file found');
      return false;
    }

    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;

      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        this.envVars[key.trim()] = value.trim();
      }
    });

    console.log(`✅ Loaded ${Object.keys(this.envVars).length} environment variables from .env.local`);
    return true;
  }

  // Generate env template files for each app
  generateTemplates() {
    if (!fs.existsSync(this.envTemplateDir)) {
      fs.mkdirSync(this.envTemplateDir, { recursive: true });
    }

    Object.entries(APP_ENV_REQUIREMENTS).forEach(([app, config]) => {
      const templatePath = path.join(this.envTemplateDir, `${app}.env.template`);
      let content = `# Environment variables for ${config.name}\n`;
      content += `# Generated on ${new Date().toISOString()}\n\n`;

      // Add required variables
      content += '# Required Variables\n';
      config.required.forEach(category => {
        content += `\n# ${ENV_CATEGORIES[category].name}\n`;
        ENV_CATEGORIES[category].vars.forEach(varName => {
          const value = this.envVars[varName] || '';
          content += `${varName}=${value}\n`;
        });
      });

      // Add optional variables
      if (config.optional && config.optional.length > 0) {
        content += '\n# Optional Variables\n';
        config.optional.forEach(category => {
          content += `\n# ${ENV_CATEGORIES[category].name}\n`;
          ENV_CATEGORIES[category].vars.forEach(varName => {
            const value = this.envVars[varName] || '';
            content += `# ${varName}=${value}\n`;
          });
        });
      }

      fs.writeFileSync(templatePath, content);
      console.log(`✅ Generated template for ${config.name}: ${templatePath}`);
    });
  }

  // Push environment variables to Vercel
  async pushToVercel(projectName, environment = 'development') {
    console.log(`\n📤 Pushing environment variables to Vercel (${projectName})...`);

    const config = APP_ENV_REQUIREMENTS[projectName];
    if (!config) {
      console.error(`❌ Unknown project: ${projectName}`);
      return false;
    }

    const envFlag = environment === 'production' ? '--prod' : '';
    let successCount = 0;
    let failCount = 0;

    // Process required variables
    for (const category of config.required) {
      for (const varName of ENV_CATEGORIES[category].vars) {
        if (this.envVars[varName]) {
          try {
            // Remove existing variable first (to update it)
            try {
              execSync(`vercel env rm ${varName} ${envFlag} --yes`, {
                stdio: 'pipe',
                cwd: this.rootDir
              });
            } catch (e) {
              // Variable might not exist, that's ok
            }

            // Add the variable
            const value = this.envVars[varName];
            const command = `echo "${value}" | vercel env add ${varName} ${envFlag}`;
            
            execSync(command, {
              stdio: 'pipe',
              cwd: this.rootDir,
              shell: true
            });

            console.log(`  ✅ ${varName}`);
            successCount++;
          } catch (error) {
            console.log(`  ❌ ${varName}: ${error.message}`);
            failCount++;
          }
        } else {
          console.log(`  ⚠️  ${varName}: Not found in .env.local`);
        }
      }
    }

    console.log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed`);
    return failCount === 0;
  }

  // Pull environment variables from Vercel
  async pullFromVercel(projectName, environment = 'development') {
    console.log(`\n📥 Pulling environment variables from Vercel (${projectName})...`);

    try {
      const envFlag = environment === 'production' ? 'production' : 'development';
      const outputPath = path.join(this.envTemplateDir, `${projectName}.env.${envFlag}`);

      execSync(`vercel env pull ${outputPath} --environment=${envFlag} --yes`, {
        stdio: 'inherit',
        cwd: this.rootDir
      });

      console.log(`✅ Environment variables saved to: ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to pull environment variables: ${error.message}`);
      return false;
    }
  }

  // Create a secure env file for CI/CD
  generateCIEnvFile() {
    const ciEnvPath = path.join(this.envTemplateDir, 'ci.env');
    let content = '# Environment variables for CI/CD\n';
    content += '# Add these as secrets in your CI/CD platform\n\n';

    // Only include non-sensitive variable names
    const publicVars = [];
    const secretVars = [];

    Object.keys(this.envVars).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicVars.push(key);
      } else {
        secretVars.push(key);
      }
    });

    content += '# Public Variables (can be exposed)\n';
    publicVars.forEach(key => {
      content += `${key}=${this.envVars[key]}\n`;
    });

    content += '\n# Secret Variables (must be added as secrets)\n';
    secretVars.forEach(key => {
      content += `# ${key}=<ADD_AS_SECRET>\n`;
    });

    fs.writeFileSync(ciEnvPath, content);
    console.log(`✅ Generated CI/CD env template: ${ciEnvPath}`);
  }

  // Interactive menu
  async showMenu() {
    console.log('\n🔧 Environment Variables Manager\n');
    console.log('1. Load from .env.local and generate templates');
    console.log('2. Push variables to Vercel (specific project)');
    console.log('3. Pull variables from Vercel');
    console.log('4. Generate CI/CD env file');
    console.log('5. Push all variables to all projects');
    console.log('6. Validate environment setup');
    console.log('0. Exit');

    const choice = await question('\nSelect an option: ');

    switch (choice) {
      case '1':
        if (this.loadEnvFile()) {
          this.generateTemplates();
        }
        break;

      case '2':
        if (!this.loadEnvFile()) break;
        console.log('\nProjects:');
        console.log('1. admin');
        console.log('2. fabric-store');
        console.log('3. store-guide');
        const projectChoice = await question('Select project: ');
        const projects = ['', 'admin', 'fabric-store', 'store-guide'];
        const project = projects[parseInt(projectChoice)];
        
        if (project) {
          const env = await question('Environment (development/production): ');
          await this.pushToVercel(project, env || 'development');
        }
        break;

      case '3':
        console.log('\nProjects:');
        console.log('1. admin');
        console.log('2. fabric-store');
        console.log('3. store-guide');
        const pullChoice = await question('Select project: ');
        const pullProjects = ['', 'admin', 'fabric-store', 'store-guide'];
        const pullProject = pullProjects[parseInt(pullChoice)];
        
        if (pullProject) {
          const env = await question('Environment (development/production): ');
          await this.pullFromVercel(pullProject, env || 'development');
        }
        break;

      case '4':
        if (this.loadEnvFile()) {
          this.generateCIEnvFile();
        }
        break;

      case '5':
        if (!this.loadEnvFile()) break;
        const envAll = await question('Environment (development/production): ');
        for (const project of ['admin', 'fabric-store', 'store-guide']) {
          await this.pushToVercel(project, envAll || 'development');
        }
        break;

      case '6':
        this.validateSetup();
        break;

      case '0':
        rl.close();
        return;

      default:
        console.log('Invalid option');
    }

    // Show menu again
    await this.showMenu();
  }

  validateSetup() {
    console.log('\n🔍 Validating Environment Setup...\n');
    
    if (!this.loadEnvFile()) {
      console.log('❌ No .env.local file found');
      return;
    }

    Object.entries(APP_ENV_REQUIREMENTS).forEach(([app, config]) => {
      console.log(`\n📱 ${config.name}:`);
      
      // Check required variables
      let missingRequired = [];
      config.required.forEach(category => {
        ENV_CATEGORIES[category].vars.forEach(varName => {
          if (!this.envVars[varName]) {
            missingRequired.push(varName);
          }
        });
      });

      if (missingRequired.length === 0) {
        console.log('  ✅ All required variables present');
      } else {
        console.log('  ❌ Missing required variables:');
        missingRequired.forEach(v => console.log(`     - ${v}`));
      }
    });
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const manager = new EnvManager();

  if (args.length === 0) {
    // Interactive mode
    await manager.showMenu();
  } else {
    // Command mode
    const command = args[0];
    
    switch (command) {
      case 'generate':
        if (manager.loadEnvFile()) {
          manager.generateTemplates();
        }
        break;

      case 'push':
        if (!manager.loadEnvFile()) break;
        const project = args[1] || 'admin';
        const env = args[2] || 'development';
        await manager.pushToVercel(project, env);
        break;

      case 'pull':
        const pullProject = args[1] || 'admin';
        const pullEnv = args[2] || 'development';
        await manager.pullFromVercel(pullProject, pullEnv);
        break;

      case 'validate':
        manager.validateSetup();
        break;

      case 'ci':
        if (manager.loadEnvFile()) {
          manager.generateCIEnvFile();
        }
        break;

      case '--help':
        console.log(`
Environment Variables Manager

Usage: node manage-env-vars.js [command] [options]

Commands:
  generate              Generate env templates from .env.local
  push [project] [env]  Push variables to Vercel project
  pull [project] [env]  Pull variables from Vercel project
  validate              Validate environment setup
  ci                    Generate CI/CD env file
  --help               Show this help message

Interactive mode:
  Run without arguments to use interactive menu

Examples:
  node manage-env-vars.js generate
  node manage-env-vars.js push admin production
  node manage-env-vars.js pull fabric-store development
        `);
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Use --help to see available commands');
    }
    
    rl.close();
  }
}

main().catch(console.error);