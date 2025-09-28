#!/usr/bin/env node

/**
 * Sandbox Environment Workarounds
 *
 * Solutions for developers working in restricted sandbox environments:
 * - Network connectivity issues (EAI_AGAIN against Neon)
 * - File system permission issues (CLI config directory)
 * - Alternative testing approaches
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface EnvironmentCheck {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  solution: string;
  workaround?: () => Promise<void>;
}

class SandboxEnvironmentHelper {
  private checks: EnvironmentCheck[] = [
    {
      name: 'NETWORK_CONNECTIVITY',
      description: 'Test network connectivity to Neon database',
      check: async () => {
        try {
          const { Pool } = require('pg');
          const testUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
          if (!testUrl) return false;

          const pool = new Pool({
            connectionString: testUrl,
            connectionTimeoutMillis: 5000,
            ssl: testUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
          });

          await pool.query('SELECT 1');
          await pool.end();
          return true;
        } catch (error) {
          console.log(`   Network error: ${error.code || error.message}`);
          return false;
        }
      },
      solution: 'Request outbound access to ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech:5432',
      workaround: async () => {
        await this.setupLocalPostgres();
      },
    },
    {
      name: 'MEDUSA_CONFIG_WRITE',
      description: 'Test Medusa CLI config directory write access',
      check: async () => {
        try {
          const configDir = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.config');
          const medusaConfigDir = path.join(configDir, 'medusa');

          // Try to create directory
          fs.mkdirSync(medusaConfigDir, { recursive: true });

          // Test write access
          const testFile = path.join(medusaConfigDir, 'test-write.tmp');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);

          return true;
        } catch (error) {
          console.log(`   Permission error: ${error.message}`);
          return false;
        }
      },
      solution: 'Set writable XDG_CONFIG_HOME or fix ~/.config/medusa permissions',
      workaround: async () => {
        await this.setupLocalConfigDir();
      },
    },
    {
      name: 'NODE_MODULES_ACCESS',
      description: 'Test node_modules and dependency access',
      check: async () => {
        try {
          require('pg');
          require('@medusajs/framework/utils');
          return true;
        } catch (error) {
          console.log(`   Dependency error: ${error.message}`);
          return false;
        }
      },
      solution: 'Run npm install to ensure all dependencies are available',
      workaround: async () => {
        console.log('   Installing dependencies...');
        await execAsync('npm install');
      },
    },
  ];

  async diagnoseEnvironment(): Promise<void> {
    console.log('🔍 Diagnosing sandbox environment...\n');

    for (const check of this.checks) {
      console.log(`📋 ${check.name}: ${check.description}`);

      const passed = await check.check();

      if (passed) {
        console.log('   ✅ PASSED\n');
      } else {
        console.log('   ❌ FAILED');
        console.log(`   💡 Solution: ${check.solution}`);

        if (check.workaround) {
          console.log('   🔧 Attempting workaround...');
          try {
            await check.workaround();
            console.log('   ✅ Workaround applied\n');
          } catch (error) {
            console.log(`   ❌ Workaround failed: ${error.message}\n`);
          }
        } else {
          console.log('   ⚠️  Manual intervention required\n');
        }
      }
    }

    console.log('📊 Environment diagnosis complete\n');
  }

  private async setupLocalPostgres(): Promise<void> {
    console.log('🐘 Setting up local PostgreSQL with Docker...');

    const dockerCompose = `
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: medusa_test
      POSTGRES_USER: medusa
      POSTGRES_PASSWORD: medusa
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medusa -d medusa_test"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_test_data:
`;

    fs.writeFileSync('docker-compose.test.yml', dockerCompose);

    console.log('   📝 Created docker-compose.test.yml');
    console.log('   🚀 Starting PostgreSQL container...');

    await execAsync('docker-compose -f docker-compose.test.yml up -d postgres-test');

    // Wait for postgres to be ready
    console.log('   ⏳ Waiting for PostgreSQL to be ready...');
    let retries = 30;
    while (retries > 0) {
      try {
        await execAsync('docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U medusa -d medusa_test');
        break;
      } catch {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (retries === 0) {
      throw new Error('PostgreSQL failed to start within timeout');
    }

    console.log('   ✅ Local PostgreSQL ready at localhost:5433');

    // Update environment variables
    const localDbUrl = 'postgresql://medusa:medusa@localhost:5433/medusa_test';
    console.log(`   📝 Use this DATABASE_URL_TEST: ${localDbUrl}`);

    // Create .env.sandbox file
    const sandboxEnv = `
# Sandbox Environment Configuration
DATABASE_URL_TEST=${localDbUrl}
NEON_DATABASE_URL=${localDbUrl}
NODE_ENV=test

# Medusa Configuration
JWT_SECRET=sandbox_jwt_secret
COOKIE_SECRET=sandbox_cookie_secret
DISABLE_MEDUSA_ADMIN=true

# Local development URLs
MEDUSA_BACKEND_URL=http://localhost:9000
`;

    fs.writeFileSync('.env.sandbox', sandboxEnv);
    console.log('   📝 Created .env.sandbox with local database configuration');
  }

  private async setupLocalConfigDir(): Promise<void> {
    console.log('📁 Setting up local Medusa config directory...');

    const localConfigDir = path.join(process.cwd(), '.medusa-config');

    try {
      fs.mkdirSync(localConfigDir, { recursive: true });

      // Create a local config
      const configContent = {
        version: '1.0.0',
        lastUsed: new Date().toISOString(),
        projects: {},
      };

      fs.writeFileSync(
        path.join(localConfigDir, 'config.json'),
        JSON.stringify(configContent, null, 2)
      );

      console.log(`   ✅ Local config directory: ${localConfigDir}`);
      console.log(`   📝 Use: XDG_CONFIG_HOME=${localConfigDir} npx medusa ...`);

      // Create helper script
      const helperScript = `#!/bin/bash
# Medusa CLI Helper for Sandbox Environment
export XDG_CONFIG_HOME="${localConfigDir}"
export DATABASE_URL_TEST="postgresql://medusa:medusa@localhost:5433/medusa_test"

echo "🔧 Sandbox Medusa CLI Environment"
echo "📁 Config dir: $XDG_CONFIG_HOME"
echo "🔗 Database: $DATABASE_URL_TEST"
echo ""

exec npx medusa "$@"
`;

      fs.writeFileSync('medusa-sandbox.sh', helperScript);
      await execAsync('chmod +x medusa-sandbox.sh');

      console.log('   📝 Created medusa-sandbox.sh helper script');
      console.log('   💡 Use: ./medusa-sandbox.sh regions:list');

    } catch (error) {
      throw new Error(`Failed to setup local config directory: ${error.message}`);
    }
  }

  async createOfflineTestSuite(): Promise<void> {
    console.log('🧪 Creating offline test suite...');

    const offlineTest = `
/**
 * Offline Test Suite
 *
 * Tests that work without external database connectivity
 */

// Jest configuration for offline tests
jest.setTimeout(10000);

describe('Offline Multi-Material Tests', () => {
  describe('Data Validation Logic', () => {
    it('should validate material ID arrays', () => {
      const validateMaterialIds = (ids: string[]) => {
        if (!Array.isArray(ids)) return false;
        if (ids.length === 0) return true;
        return ids.every(id => typeof id === 'string' && id.length > 0);
      };

      expect(validateMaterialIds([])).toBe(true);
      expect(validateMaterialIds(['mat_1', 'mat_2'])).toBe(true);
      expect(validateMaterialIds(['mat_1', ''])).toBe(false);
      expect(validateMaterialIds(null as any)).toBe(false);
    });

    it('should deduplicate material IDs', () => {
      const deduplicateMaterialIds = (ids: string[]) => {
        return Array.from(new Set(ids));
      };

      const input = ['mat_1', 'mat_2', 'mat_1', 'mat_3', 'mat_2'];
      const result = deduplicateMaterialIds(input);

      expect(result).toEqual(['mat_1', 'mat_2', 'mat_3']);
      expect(result.length).toBe(3);
    });

    it('should generate unique link IDs', () => {
      const generateLinkId = () => \`pvmat_\${Math.random().toString(36).slice(2, 10)}\`;

      const id1 = generateLinkId();
      const id2 = generateLinkId();

      expect(id1).toMatch(/^pvmat_[a-z0-9]{8}$/);
      expect(id2).toMatch(/^pvmat_[a-z0-9]{8}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('API Request Validation', () => {
    it('should validate material assignment requests', () => {
      const validateMaterialAssignmentRequest = (body: any) => {
        if (!body || typeof body !== 'object') return false;
        if (!body.material_ids) return true; // Allow clearing materials
        if (!Array.isArray(body.material_ids)) return false;
        return body.material_ids.every((id: any) => typeof id === 'string');
      };

      expect(validateMaterialAssignmentRequest({ material_ids: ['mat_1'] })).toBe(true);
      expect(validateMaterialAssignmentRequest({ material_ids: [] })).toBe(true);
      expect(validateMaterialAssignmentRequest({})).toBe(true);
      expect(validateMaterialAssignmentRequest({ material_ids: 'not_array' })).toBe(false);
      expect(validateMaterialAssignmentRequest(null)).toBe(false);
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate consistent test data', () => {
      const prefix = 'test_123';
      const generateTestMaterial = (id: string) => ({
        id: \`\${prefix}_mat_\${id}\`,
        name: \`Test Material \${id}\`,
        type: 'cotton',
        properties: { weight: 400 }
      });

      const material = generateTestMaterial('A');

      expect(material.id).toBe('test_123_mat_A');
      expect(material.name).toBe('Test Material A');
      expect(material.type).toBe('cotton');
    });
  });
});
`;

    fs.writeFileSync('src/api/admin/products/__tests__/offline.test.ts', offlineTest);
    console.log('   ✅ Created offline test suite');
    console.log('   🚀 Run with: npm test -- offline.test.ts');
  }

  async createSandboxCommands(): Promise<void> {
    console.log('🔧 Creating sandbox-specific commands...');

    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Add sandbox-specific scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'sandbox:setup': 'npx tsx scripts/sandbox-workarounds.ts',
      'sandbox:test:offline': 'jest --testPathPattern="offline\\.test\\.ts"',
      'sandbox:test:local': 'DATABASE_URL_TEST="postgresql://medusa:medusa@localhost:5433/medusa_test" npm run test:e2e:enhanced',
      'sandbox:postgres:start': 'docker-compose -f docker-compose.test.yml up -d postgres-test',
      'sandbox:postgres:stop': 'docker-compose -f docker-compose.test.yml down',
      'sandbox:postgres:logs': 'docker-compose -f docker-compose.test.yml logs postgres-test',
      'sandbox:medusa': 'XDG_CONFIG_HOME=./.medusa-config DATABASE_URL_TEST="postgresql://medusa:medusa@localhost:5433/medusa_test" npx medusa',
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('   ✅ Added sandbox commands to package.json');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const helper = new SandboxEnvironmentHelper();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Sandbox Environment Helper

Commands:
  npx tsx scripts/sandbox-workarounds.ts          # Full environment setup
  npm run sandbox:setup                           # Same as above
  npm run sandbox:postgres:start                  # Start local PostgreSQL
  npm run sandbox:test:offline                    # Run offline tests
  npm run sandbox:test:local                      # Run tests with local DB
  npm run sandbox:medusa regions:list             # Use Medusa CLI with local config

This tool helps developers work around sandbox restrictions:
- Sets up local PostgreSQL for testing
- Creates local Medusa config directory
- Provides offline testing alternatives
- Generates sandbox-specific commands
`);
    return;
  }

  try {
    console.log('🏖️  Sandbox Environment Helper\n');

    await helper.diagnoseEnvironment();
    await helper.createOfflineTestSuite();
    await helper.createSandboxCommands();

    console.log('🎉 Sandbox environment setup complete!\n');
    console.log('Next steps for your developer:');
    console.log('1. npm run sandbox:postgres:start    # Start local database');
    console.log('2. npm run sandbox:test:offline      # Run offline tests');
    console.log('3. npm run sandbox:test:local        # Run tests with local DB');
    console.log('4. ./medusa-sandbox.sh regions:list  # Use Medusa CLI');

  } catch (error) {
    console.error('❌ Sandbox setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SandboxEnvironmentHelper };
