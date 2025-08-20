#!/usr/bin/env node

/**
 * Railway Environment Variables Setup Script
 * Prepares and validates environment variables for Railway deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Railway-specific environment variables mapping
const RAILWAY_ENV_MAPPING = {
  // Database
  DATABASE_URL: '${POSTGRES_URL}',
  POSTGRES_URL: '${RAILWAY_POSTGRES_URL}',
  POSTGRES_URL_NON_POOLING: '${RAILWAY_POSTGRES_URL_NON_POOLING}',
  POSTGRES_USER: '${RAILWAY_POSTGRES_USER}',
  POSTGRES_HOST: '${RAILWAY_POSTGRES_HOST}',
  POSTGRES_PASSWORD: '${RAILWAY_POSTGRES_PASSWORD}',
  POSTGRES_DATABASE: '${RAILWAY_POSTGRES_DATABASE}',
  
  // Redis (Railway Redis)
  REDIS_URL: '${RAILWAY_REDIS_URL}',
  KV_REST_API_URL: '${UPSTASH_REDIS_REST_URL}',
  KV_REST_API_TOKEN: '${UPSTASH_REDIS_REST_TOKEN}',
  
  // Application
  PORT: '${PORT}',
  NODE_ENV: 'production',
  NEXTAUTH_URL: '${RAILWAY_STATIC_URL}',
  
  // Keep existing from .env.local
  NEXTAUTH_SECRET: null,
  GOOGLE_CLIENT_ID: null,
  GOOGLE_CLIENT_SECRET: null,
  RESEND_API_KEY: null,
  RESEND_FROM_EMAIL: null,
  R2_BUCKET: null,
  R2_ACCESS_KEY_ID: null,
  R2_SECRET_ACCESS_KEY: null,
  R2_ACCOUNT_ID: null,
  S3_URL: null
};

class RailwayEnvManager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../..');
    this.envPath = path.join(this.rootDir, '.env.local');
    this.railwayEnvPath = path.join(this.rootDir, '.env.railway');
    this.localEnvVars = {};
  }

  loadLocalEnv() {
    if (!fs.existsSync(this.envPath)) {
      console.error('❌ No .env.local file found');
      return false;
    }

    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        this.localEnvVars[key.trim()] = value.trim();
      }
    });

    console.log(`✅ Loaded ${Object.keys(this.localEnvVars).length} variables from .env.local`);
    return true;
  }

  generateRailwayEnv() {
    let content = '# Railway Environment Variables\n';
    content += '# Generated on ' + new Date().toISOString() + '\n\n';
    
    content += '# === Railway Provided Variables ===\n';
    content += '# These are automatically injected by Railway\n';
    content += '# DATABASE_URL=${RAILWAY_POSTGRES_URL}\n';
    content += '# REDIS_URL=${RAILWAY_REDIS_URL}\n';
    content += '# PORT=${PORT}\n\n';
    
    content += '# === Application Variables ===\n';
    content += '# Copy these to Railway dashboard\n\n';

    // Process each variable
    Object.entries(RAILWAY_ENV_MAPPING).forEach(([key, railwayVar]) => {
      if (railwayVar && railwayVar.startsWith('${')) {
        // Railway-provided variable
        content += `# ${key}=${railwayVar} (Railway provided)\n`;
      } else if (railwayVar === null) {
        // Use from local env
        const value = this.localEnvVars[key];
        if (value) {
          content += `${key}=${value}\n`;
        } else {
          content += `# ${key}=<MISSING - Add manually>\n`;
        }
      } else {
        // Static value
        content += `${key}=${railwayVar}\n`;
      }
    });

    // Add any additional variables from .env.local not in mapping
    content += '\n# === Additional Variables ===\n';
    Object.entries(this.localEnvVars).forEach(([key, value]) => {
      if (!RAILWAY_ENV_MAPPING.hasOwnProperty(key)) {
        content += `${key}=${value}\n`;
      }
    });

    fs.writeFileSync(this.railwayEnvPath, content);
    console.log(`✅ Generated Railway environment file: ${this.railwayEnvPath}`);
  }

  generateRailwayCliScript() {
    const scriptPath = path.join(__dirname, 'deploy-to-railway.sh');
    
    let script = '#!/bin/bash\n\n';
    script += '# Railway Deployment Script\n';
    script += '# Auto-generated on ' + new Date().toISOString() + '\n\n';
    
    script += 'echo "🚂 Starting Railway deployment..."\n\n';
    
    script += '# Check if Railway CLI is installed\n';
    script += 'if ! command -v railway &> /dev/null; then\n';
    script += '  echo "❌ Railway CLI not found. Install it first:"\n';
    script += '  echo "npm install -g @railway/cli"\n';
    script += '  exit 1\n';
    script += 'fi\n\n';
    
    script += '# Login to Railway (if not already logged in)\n';
    script += 'railway login\n\n';
    
    script += '# Link to project (create new or link existing)\n';
    script += 'echo "📎 Linking to Railway project..."\n';
    script += 'railway link\n\n';
    
    script += '# Set environment variables\n';
    script += 'echo "🔐 Setting environment variables..."\n\n';
    
    // Generate railway variable commands
    Object.entries(this.localEnvVars).forEach(([key, value]) => {
      // Skip Railway-provided variables
      if (!RAILWAY_ENV_MAPPING[key] || !RAILWAY_ENV_MAPPING[key].startsWith('${')) {
        // Escape special characters in value
        const escapedValue = value.replace(/"/g, '\\"').replace(/\$/g, '\\$');
        script += `railway variables set ${key}="${escapedValue}"\n`;
      }
    });
    
    script += '\n# Deploy to Railway\n';
    script += 'echo "🚀 Deploying to Railway..."\n';
    script += 'railway up\n\n';
    
    script += 'echo "✅ Deployment complete!"\n';
    script += 'echo "🌐 View your app: railway open"\n';

    fs.writeFileSync(scriptPath, script);
    
    // Make script executable on Unix systems
    if (process.platform !== 'win32') {
      execSync(`chmod +x ${scriptPath}`);
    }
    
    console.log(`✅ Generated deployment script: ${scriptPath}`);
  }

  validateRequiredVars() {
    const required = [
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID', 
      'GOOGLE_CLIENT_SECRET',
      'RESEND_API_KEY',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY'
    ];

    const missing = required.filter(key => !this.localEnvVars[key]);
    
    if (missing.length > 0) {
      console.warn('⚠️  Missing required environment variables:');
      missing.forEach(key => console.warn(`   - ${key}`));
      return false;
    }
    
    console.log('✅ All required environment variables present');
    return true;
  }

  generateDocumentation() {
    const docPath = path.join(__dirname, '../docs/RAILWAY_ENV_SETUP.md');
    
    let doc = '# Railway Environment Variables Setup\n\n';
    doc += '## Required Variables\n\n';
    doc += 'These variables must be set in Railway dashboard:\n\n';
    doc += '### Authentication\n';
    doc += '- `NEXTAUTH_SECRET` - JWT secret for authentication\n';
    doc += '- `GOOGLE_CLIENT_ID` - Google OAuth client ID\n';
    doc += '- `GOOGLE_CLIENT_SECRET` - Google OAuth secret\n\n';
    
    doc += '### Email Service (Resend)\n';
    doc += '- `RESEND_API_KEY` - Resend API key\n';
    doc += '- `RESEND_FROM_EMAIL` - From email address\n\n';
    
    doc += '### Storage (Cloudflare R2)\n';
    doc += '- `R2_BUCKET` - Bucket name\n';
    doc += '- `R2_ACCESS_KEY_ID` - Access key\n';
    doc += '- `R2_SECRET_ACCESS_KEY` - Secret key\n';
    doc += '- `R2_ACCOUNT_ID` - Account ID\n';
    doc += '- `S3_URL` - S3-compatible endpoint\n\n';
    
    doc += '## Railway-Provided Variables\n\n';
    doc += 'These are automatically available when you add Railway services:\n\n';
    doc += '### PostgreSQL\n';
    doc += '- `DATABASE_URL` - Automatically set to `RAILWAY_POSTGRES_URL`\n';
    doc += '- `POSTGRES_*` - Various PostgreSQL connection variables\n\n';
    
    doc += '### Redis\n';
    doc += '- `REDIS_URL` - Automatically set to `RAILWAY_REDIS_URL`\n\n';
    
    doc += '### Application\n';
    doc += '- `PORT` - Port number (Railway manages this)\n';
    doc += '- `RAILWAY_STATIC_URL` - Your app\'s public URL\n\n';
    
    doc += '## Setup Instructions\n\n';
    doc += '1. Run the setup script: `node deployment/railway/scripts/setup-railway-env.js`\n';
    doc += '2. Review generated `.env.railway` file\n';
    doc += '3. Copy variables to Railway dashboard or use CLI script\n';
    doc += '4. Deploy using `railway up` or push to GitHub\n';

    fs.mkdirSync(path.dirname(docPath), { recursive: true });
    fs.writeFileSync(docPath, doc);
    console.log(`✅ Generated documentation: ${docPath}`);
  }
}

// Main execution
async function main() {
  console.log('🚂 Railway Environment Setup\n');
  
  const manager = new RailwayEnvManager();
  
  // Load local environment
  if (!manager.loadLocalEnv()) {
    process.exit(1);
  }
  
  // Validate required variables
  manager.validateRequiredVars();
  
  // Generate Railway environment file
  manager.generateRailwayEnv();
  
  // Generate CLI deployment script
  manager.generateRailwayCliScript();
  
  // Generate documentation
  manager.generateDocumentation();
  
  console.log('\n✅ Railway environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Review .env.railway file');
  console.log('2. Run deployment script: bash deployment/railway/scripts/deploy-to-railway.sh');
  console.log('3. Or manually set variables in Railway dashboard');
}

main().catch(console.error);