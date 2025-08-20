#!/usr/bin/env node

/**
 * Script to update imports from old paths to new module-based paths
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Import mappings from old to new paths
const importMappings = {
  // Auth imports
  '@/lib/auth': '@/modules/auth',
  '@/lib/auth-utils': '@/modules/auth',
  '@/lib/auth-utils-jwt': '@/modules/auth',
  '@/lib/custom-auth': '@/modules/auth',
  '@/lib/auth-helpers': '@/modules/auth',
  '@/lib/auth-middleware': '@/modules/auth',
  '@/lib/auth-schema': '@/modules/auth',
  '@/lib/legacy-auth-schema': '@/modules/auth',
  
  // Fabric imports
  '@/lib/repositories/fabric.repository': '@/modules/fabrics',
  '@/lib/repositories/fabric-image.repository': '@/modules/fabrics',
  '@/lib/services/fabric.service': '@/modules/fabrics',
  '@/lib/db/schema/fabrics.schema': '@/modules/fabrics',
  '@/lib/fabric-seed-data': '@/modules/fabrics/data/seed-data',
  '@/lib/fabric-swatch-data': '@/modules/fabrics/data/swatch-data',
  '@/lib/fabric-kv': '@/modules/fabrics',
  '@/hooks/use-fabrics': '@/modules/fabrics',
  
  // Blog imports
  '@/lib/blog-data': '@/modules/blog',
  '@/lib/blog-model': '@/modules/blog',
  
  // Product imports
  '@/lib/etsy-product-model': '@/modules/products',
  '@/hooks/use-products': '@/modules/products',
  
  // Database imports
  '@/lib/db': '@/core/database/drizzle/client',
  '@/lib/db/client': '@/core/database/drizzle/db-client',
  '@/lib/db-schema': '@/core/database/schemas',
  
  // Storage imports
  '@/lib/r2-client': '@/core/storage/r2/client',
  '@/lib/r2-client-v2': '@/core/storage/r2/client',
  '@/lib/r2-client-v3': '@/core/storage/r2/client',
  
  // Email imports
  '@/lib/email-service': '@/core/email/resend.service',
  '@/lib/email-service-optimized': '@/core/email/resend.service',
  '@/lib/email-config': '@/core/email/email.config',
  
  // Cache imports
  '@/lib/kv': '@/core/cache/providers/vercel-kv',
  '@/lib/kv-client': '@/core/cache/providers/kv-client',
  '@/lib/cache/redis': '@/core/cache/providers/redis',
  '@/lib/memory-store': '@/core/cache/providers/memory-store',
  
  // Shared imports
  '@/lib/utils': '@/shared/utils',
  '@/lib/types': '@/shared/types',
  '@/lib/navigation': '@/shared/utils/navigation',
  '@/hooks/use-toast': '@/shared/hooks/use-toast',
  '@/hooks/use-mobile': '@/shared/hooks/use-mobile',
  '@/hooks/use-api': '@/shared/hooks/use-api',
  
  // Component imports
  '@/components/fabric-': '@/modules/fabrics/components/fabric-',
  '@/components/blog-': '@/modules/blog/components/blog-',
  '@/components/etsy-': '@/modules/products/components/etsy-',
  '@/components/products-': '@/modules/products/components/products-',
  '@/components/auth/': '@/modules/auth/components/',
  '@/components/ui/': '@/shared/components/ui/',
};

// Relative import mappings
const relativeImportMappings = {
  '../lib/auth': '../src/modules/auth',
  '../../lib/auth': '../../src/modules/auth',
  '../../../lib/auth': '../../../src/modules/auth',
  '../lib/db': '../src/core/database/drizzle/client',
  '../../lib/db': '../../src/core/database/drizzle/client',
  '../lib/email-service': '../src/core/email/resend.service',
  '../../lib/email-service': '../../src/core/email/resend.service',
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = [];

    // Update absolute imports
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      const regex = new RegExp(
        `(from ['"\`]|import ['"\`])${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"\`/])`,
        'g'
      );
      
      if (regex.test(content)) {
        content = content.replace(regex, `$1${newPath}$2`);
        changes.push(`${oldPath} → ${newPath}`);
      }
    }

    // Update relative imports
    for (const [oldPath, newPath] of Object.entries(relativeImportMappings)) {
      const regex = new RegExp(
        `(from ['"\`]|import ['"\`])${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"\`/])`,
        'g'
      );
      
      if (regex.test(content)) {
        content = content.replace(regex, `$1${newPath}$2`);
        changes.push(`${oldPath} → ${newPath}`);
      }
    }

    // Special case: Update getR2Client imports
    content = content.replace(
      /import\s+{\s*R2Client[^}]*}\s+from\s+['"]@\/lib\/r2-client(?:-v[23])?['"]/g,
      "import { getR2Client } from '@/core/storage/r2/client'"
    );

    // Update any R2Client instantiations
    content = content.replace(
      /new\s+R2Client\(/g,
      'getR2Client('
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${path.relative(process.cwd(), filePath)}`);
      changes.forEach(change => console.log(`   ${change}`));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

function findFilesToUpdate() {
  const patterns = [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'hooks/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'src/**/*.{ts,tsx,js,jsx}',
    'experiences/**/*.{ts,tsx,js,jsx}',
  ];

  const files = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**']
    });
    files.push(...matches);
  });

  return [...new Set(files)]; // Remove duplicates
}

function main() {
  console.log('🔄 Starting import updates...\n');

  const files = findFilesToUpdate();
  console.log(`Found ${files.length} files to check\n`);

  let updatedCount = 0;
  let errorCount = 0;

  files.forEach(file => {
    if (updateImportsInFile(file)) {
      updatedCount++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Import update complete!`);
  console.log(`   Files checked: ${files.length}`);
  console.log(`   Files updated: ${updatedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('='.repeat(50));

  if (updatedCount > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Run "npm run build" to check for any remaining issues');
    console.log('2. Run "npm run dev" to test the application');
    console.log('3. If everything works, remove old files with "npm run cleanup-old-files"');
  }
}

// Check if glob is installed
try {
  require.resolve('glob');
  main();
} catch (e) {
  console.log('Installing required dependency...');
  const { execSync } = require('child_process');
  execSync('npm install --no-save glob', { stdio: 'inherit' });
  require.cache[require.resolve('glob')] = undefined;
  main();
}