#!/usr/bin/env node

/**
 * Environment Variable Validator for Tara Hub Admin
 * 
 * Validates and manages environment variables for different deployment environments
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_SCHEMA = {
  // Database Configuration
  DATABASE_URL: {
    required: true,
    type: 'postgresql_url',
    description: 'PostgreSQL connection string (Neon)',
    example: 'postgresql://user:password@host:5432/database',
    validate: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://')
  },
  POSTGRES_URL: {
    required: false,
    type: 'postgresql_url',
    description: 'Alternative PostgreSQL connection string',
    validate: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://')
  },
  
  // Authentication Configuration
  NEXTAUTH_URL: {
    required: true,
    type: 'url',
    description: 'NextAuth callback URL',
    example: 'https://tara-hub.vercel.app',
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  },
  NEXTAUTH_SECRET: {
    required: true,
    type: 'secret',
    description: 'NextAuth JWT secret (32+ characters)',
    generate: () => crypto.randomBytes(32).toString('base64'),
    validate: (value) => value.length >= 32
  },
  
  // Email Configuration (Resend)
  RESEND_API_KEY: {
    required: true,
    type: 'api_key',
    description: 'Resend API key for magic link emails',
    example: 're_xxxxxxxxxxxxx',
    validate: (value) => value.startsWith('re_')
  },
  RESEND_FROM_EMAIL: {
    required: true,
    type: 'email',
    description: 'From email for authentication emails',
    example: 'Tara Hub Admin <admin@deepcrm.ai>',
    validate: (value) => value.includes('@')
  },
  
  // Cloudflare R2 Storage
  R2_ACCOUNT_ID: {
    required: true,
    type: 'string',
    description: 'Cloudflare account ID',
    validate: (value) => value.length > 0
  },
  R2_ACCESS_KEY_ID: {
    required: true,
    type: 'string',
    description: 'R2 access key ID',
    validate: (value) => value.length > 0
  },
  R2_SECRET_ACCESS_KEY: {
    required: true,
    type: 'secret',
    description: 'R2 secret access key',
    validate: (value) => value.length > 0
  },
  R2_BUCKET_NAME: {
    required: true,
    type: 'string',
    description: 'R2 bucket name for image storage',
    validate: (value) => /^[a-z0-9-]+$/.test(value)
  },
  
  // Vercel KV (Optional)
  KV_REST_API_URL: {
    required: false,
    type: 'url',
    description: 'Upstash Redis REST API URL',
    validate: (value) => value.includes('upstash.io')
  },
  KV_REST_API_TOKEN: {
    required: false,
    type: 'secret',
    description: 'Upstash Redis REST API token',
    validate: (value) => value.length > 0
  },
  
  // Google OAuth (Legacy/Optional)
  GOOGLE_CLIENT_ID: {
    required: false,
    type: 'string',
    description: 'Google OAuth client ID',
    validate: (value) => value.endsWith('.apps.googleusercontent.com')
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    type: 'secret',
    description: 'Google OAuth client secret',
    validate: (value) => value.length > 0
  }
};

class EnvValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.envPath = path.join(this.projectRoot, '.env.local');
    this.envExamplePath = path.join(this.projectRoot, '.env.example');
    this.errors = [];
    this.warnings = [];
  }

  run(options = {}) {
    console.log('🔍 Validating environment variables...\n');
    
    // Load environment variables
    const envVars = this.loadEnvFile(this.envPath);
    
    if (!envVars) {
      this.createEnvFile();
      return;
    }
    
    // Validate each variable
    this.validateVariables(envVars);
    
    // Check for production readiness
    if (options.production) {
      this.checkProductionReadiness(envVars);
    }
    
    // Generate missing secrets
    if (options.generate) {
      this.generateMissingSecrets(envVars);
    }
    
    // Show results
    this.showResults();
    
    // Save validated env file
    if (options.save && this.errors.length === 0) {
      this.saveEnvFile(envVars);
    }
    
    return this.errors.length === 0;
  }

  loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Environment file not found: ${filePath}`);
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    });
    
    return envVars;
  }

  validateVariables(envVars) {
    Object.entries(ENV_SCHEMA).forEach(([key, schema]) => {
      const value = envVars[key];
      
      // Check if required variable exists
      if (schema.required && (!value || value === '')) {
        this.errors.push({
          key,
          message: `Missing required variable: ${key}`,
          description: schema.description,
          example: schema.example
        });
        return;
      }
      
      // Skip validation for optional empty variables
      if (!schema.required && (!value || value === '')) {
        this.warnings.push({
          key,
          message: `Optional variable not set: ${key}`,
          description: schema.description
        });
        return;
      }
      
      // Validate the value
      if (value && schema.validate && !schema.validate(value)) {
        this.errors.push({
          key,
          message: `Invalid value for ${key}`,
          description: schema.description,
          example: schema.example
        });
      }
    });
  }

  checkProductionReadiness(envVars) {
    console.log('\n🏭 Checking production readiness...\n');
    
    // Check for localhost in URLs
    if (envVars.NEXTAUTH_URL && envVars.NEXTAUTH_URL.includes('localhost')) {
      this.warnings.push({
        key: 'NEXTAUTH_URL',
        message: 'Contains localhost - update for production',
        suggestion: 'Use your production domain (e.g., https://tara-hub.vercel.app)'
      });
    }
    
    // Check for weak secrets
    if (envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET.length < 32) {
      this.errors.push({
        key: 'NEXTAUTH_SECRET',
        message: 'Secret is too short for production',
        suggestion: 'Generate a strong secret with: openssl rand -base64 32'
      });
    }
    
    // Check for test/development values
    const testPatterns = ['test', 'demo', 'example', 'localhost', '127.0.0.1'];
    Object.entries(envVars).forEach(([key, value]) => {
      if (testPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
        this.warnings.push({
          key,
          message: 'May contain test/development value',
          value: value.substring(0, 20) + '...'
        });
      }
    });
  }

  generateMissingSecrets(envVars) {
    console.log('\n🔐 Generating missing secrets...\n');
    
    Object.entries(ENV_SCHEMA).forEach(([key, schema]) => {
      if (schema.generate && (!envVars[key] || envVars[key] === '')) {
        const generated = schema.generate();
        envVars[key] = generated;
        console.log(`✅ Generated ${key}: ${generated.substring(0, 10)}...`);
      }
    });
  }

  createEnvFile() {
    console.log('\n📝 Creating new .env.local file...\n');
    
    const template = this.generateEnvTemplate();
    
    // Create backup if file exists
    if (fs.existsSync(this.envPath)) {
      const backupPath = `${this.envPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.envPath, backupPath);
      console.log(`📦 Backup created: ${backupPath}`);
    }
    
    // Write new env file
    fs.writeFileSync(this.envPath, template);
    console.log(`✅ Created: ${this.envPath}`);
    console.log('\n⚠️  Please update the file with your actual values!');
  }

  generateEnvTemplate() {
    let template = '# Tara Hub Admin Environment Variables\n';
    template += `# Generated on ${new Date().toISOString()}\n\n`;
    
    // Group variables by category
    const categories = {
      'Database Configuration': ['DATABASE_URL', 'POSTGRES_URL'],
      'Authentication': ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'],
      'Email Service (Resend)': ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
      'Cloudflare R2 Storage': ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'],
      'Vercel KV (Optional)': ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
      'Google OAuth (Optional)': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    };
    
    Object.entries(categories).forEach(([category, keys]) => {
      template += `# ${category}\n`;
      
      keys.forEach(key => {
        const schema = ENV_SCHEMA[key];
        if (!schema) return;
        
        template += `# ${schema.description}\n`;
        if (schema.example) {
          template += `# Example: ${schema.example}\n`;
        }
        
        const value = schema.generate ? schema.generate() : '';
        template += `${key}=${value}\n\n`;
      });
    });
    
    return template;
  }

  saveEnvFile(envVars) {
    console.log('\n💾 Saving validated environment file...\n');
    
    // Create backup
    const backupPath = `${this.envPath}.backup.${Date.now()}`;
    if (fs.existsSync(this.envPath)) {
      fs.copyFileSync(this.envPath, backupPath);
      console.log(`📦 Backup created: ${backupPath}`);
    }
    
    // Generate content
    let content = '# Tara Hub Admin Environment Variables\n';
    content += `# Validated on ${new Date().toISOString()}\n\n`;
    
    Object.entries(envVars).forEach(([key, value]) => {
      const schema = ENV_SCHEMA[key];
      if (schema) {
        content += `# ${schema.description}\n`;
      }
      content += `${key}=${value}\n`;
    });
    
    // Write file
    fs.writeFileSync(this.envPath, content);
    console.log(`✅ Saved: ${this.envPath}`);
  }

  showResults() {
    console.log('\n' + '='.repeat(50));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(50) + '\n');
    
    if (this.errors.length > 0) {
      console.log('❌ ERRORS (' + this.errors.length + '):\n');
      this.errors.forEach(error => {
        console.log(`  ${error.key}:`);
        console.log(`    ${error.message}`);
        if (error.description) {
          console.log(`    ℹ️  ${error.description}`);
        }
        if (error.example) {
          console.log(`    Example: ${error.example}`);
        }
        console.log();
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS (' + this.warnings.length + '):\n');
      this.warnings.forEach(warning => {
        console.log(`  ${warning.key}:`);
        console.log(`    ${warning.message}`);
        if (warning.suggestion) {
          console.log(`    💡 ${warning.suggestion}`);
        }
        console.log();
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All environment variables are valid!\n');
    }
    
    console.log('='.repeat(50));
  }

  // Export environment variables for CI/CD
  exportForCI(platform = 'vercel') {
    const envVars = this.loadEnvFile(this.envPath);
    if (!envVars) return;
    
    const outputPath = path.join(this.projectRoot, `.env.${platform}`);
    
    if (platform === 'vercel') {
      // Generate Vercel-specific format
      let content = '';
      Object.entries(envVars).forEach(([key, value]) => {
        // Skip local-only variables
        if (key.startsWith('LOCAL_')) return;
        content += `${key}="${value}"\n`;
      });
      
      fs.writeFileSync(outputPath, content);
      console.log(`✅ Exported for Vercel: ${outputPath}`);
      console.log('\nRun: vercel env pull to sync with Vercel');
    }
    
    if (platform === 'github') {
      // Generate GitHub Actions secrets format
      let content = '# GitHub Actions Secrets\n\n';
      Object.entries(envVars).forEach(([key, value]) => {
        const schema = ENV_SCHEMA[key];
        if (schema && schema.type === 'secret') {
          content += `# Secret: ${key}\n`;
          content += `# Add via: gh secret set ${key}\n\n`;
        } else {
          content += `${key}="${value}"\n`;
        }
      });
      
      fs.writeFileSync(outputPath, content);
      console.log(`✅ Exported for GitHub Actions: ${outputPath}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const validator = new EnvValidator();
  const args = process.argv.slice(2);
  
  const options = {
    production: args.includes('--production') || args.includes('-p'),
    generate: args.includes('--generate') || args.includes('-g'),
    save: args.includes('--save') || args.includes('-s'),
    export: args.find(arg => arg.startsWith('--export='))
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Tara Hub Admin - Environment Variable Validator

Usage: node env-validator.js [options]

Options:
  -p, --production    Check for production readiness
  -g, --generate      Generate missing secrets
  -s, --save          Save validated environment file
  --export=platform   Export for CI/CD (vercel, github)
  -h, --help          Show this help message

Examples:
  node env-validator.js                    # Basic validation
  node env-validator.js --production       # Production checks
  node env-validator.js --generate --save  # Generate and save
  node env-validator.js --export=vercel    # Export for Vercel
    `);
    process.exit(0);
  }
  
  if (options.export) {
    const platform = options.export.split('=')[1];
    validator.exportForCI(platform);
  } else {
    const isValid = validator.run(options);
    process.exit(isValid ? 0 : 1);
  }
}

module.exports = EnvValidator;