#!/usr/bin/env node

/**
 * Script to safely remove old files after migration to module-based architecture
 * Run with: node scripts/cleanup-old-files.js
 */

const fs = require('fs');
const path = require('path');

// Files to remove (old locations that have been migrated)
const filesToRemove = [
  // Auth files (migrated to src/modules/auth)
  'lib/auth.ts',
  'lib/auth-utils.ts',
  'lib/auth-utils-jwt.ts',
  'lib/custom-auth.ts',
  'lib/auth-helpers.ts',
  'lib/auth-middleware.ts',
  'lib/auth-schema.ts',
  'lib/legacy-auth-schema.ts',
  
  // Fabric files (migrated to src/modules/fabrics)
  'lib/repositories/fabric.repository.ts',
  'lib/repositories/fabric-image.repository.ts',
  'lib/services/fabric.service.ts',
  'lib/db/schema/fabrics.schema.ts',
  'lib/db/schema/fabrics.schema.ts.backup',
  'lib/fabric-seed-data.ts',
  'lib/fabric-swatch-data.ts',
  'lib/fabric-kv.ts',
  
  // Blog files (migrated to src/modules/blog)
  'lib/blog-data.ts',
  'lib/blog-model.ts',
  
  // Product files (migrated to src/modules/products)
  'lib/etsy-product-model.ts',
  
  // Database files (migrated to src/core/database)
  'lib/db.ts',
  'lib/db/client.ts',
  'lib/db-schema.ts',
  
  // Storage files (migrated to src/core/storage)
  'lib/r2-client.ts',
  'lib/r2-client-v2.ts',
  'lib/r2-client-v3.ts',
  
  // Email files (migrated to src/core/email)
  'lib/email-service.ts',
  'lib/email-service-optimized.ts',
  'lib/email-config.ts',
  
  // Cache files (migrated to src/core/cache)
  'lib/kv.ts',
  'lib/kv-client.ts',
  'lib/cache/redis.ts',
  'lib/memory-store.ts',
  
  // Shared files (migrated to src/shared)
  'lib/utils.ts',
  'lib/types.ts',
  'lib/navigation.ts',
  
  // Hooks (migrated to modules)
  'hooks/use-fabrics.ts',
  'hooks/use-products.ts',
  'hooks/use-toast.ts',
  'hooks/use-mobile.tsx',
  'hooks/use-api.ts',
  
  // Components (migrated to modules)
  'components/fabric-card.tsx',
  'components/fabric-detail-page.tsx',
  'components/fabric-form.tsx',
  'components/fabric-modal.tsx',
  'components/fabrics-listing-page.tsx',
  'components/fabrics-view.tsx',
  'components/blog-editor.tsx',
  'components/blog-preview.tsx',
  'components/etsy-product-editor.tsx',
  'components/etsy-featured-products.tsx',
  'components/products-view.tsx',
  'components/auth/magic-link-form.tsx',
  'components/auth/protected-route.tsx',
  'components/auth/user-menu.tsx',
];

// Directories to check if empty and remove
const directoriesToClean = [
  'lib/repositories',
  'lib/services',
  'lib/db/schema',
  'lib/db',
  'lib/cache',
  'lib/auth',
  'components/auth',
];

function removeFile(filePath) {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  Already removed: ${filePath}`);
    return true;
  }
  
  try {
    fs.unlinkSync(fullPath);
    console.log(`  ✅ Removed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to remove ${filePath}: ${error.message}`);
    return false;
  }
}

function removeEmptyDirectory(dirPath) {
  const fullPath = path.resolve(dirPath);
  
  if (!fs.existsSync(fullPath)) {
    return true;
  }
  
  try {
    const files = fs.readdirSync(fullPath);
    if (files.length === 0) {
      fs.rmdirSync(fullPath);
      console.log(`  ✅ Removed empty directory: ${dirPath}`);
      return true;
    } else {
      console.log(`  ⚠️  Directory not empty: ${dirPath} (${files.length} files)`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Failed to remove directory ${dirPath}: ${error.message}`);
    return false;
  }
}

function confirmRemoval() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  This will permanently delete old files. Are you sure? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  console.log('🧹 Old Files Cleanup Script\n');
  console.log('This script will remove files that have been migrated to the new module structure.\n');
  
  // Check if we're in the right directory
  if (!fs.existsSync('src/modules')) {
    console.error('❌ Error: src/modules directory not found!');
    console.error('   Make sure you run this script from the project root.');
    process.exit(1);
  }
  
  // Confirm with user
  const confirmed = await confirmRemoval();
  
  if (!confirmed) {
    console.log('\n❌ Cleanup cancelled.');
    process.exit(0);
  }
  
  console.log('\n📁 Removing old files...\n');
  
  let totalFiles = filesToRemove.length;
  let removedFiles = 0;
  let failedFiles = 0;
  
  // Remove files
  for (const file of filesToRemove) {
    if (removeFile(file)) {
      removedFiles++;
    } else {
      failedFiles++;
    }
  }
  
  console.log('\n📁 Cleaning up empty directories...\n');
  
  // Clean up empty directories (in reverse order for nested dirs)
  for (const dir of directoriesToClean.reverse()) {
    removeEmptyDirectory(dir);
  }
  
  // Remove compatibility layer if all files were successfully removed
  if (failedFiles === 0) {
    console.log('\n📝 Removing compatibility layer...');
    removeFile('lib/compat.ts');
  } else {
    console.log('\n⚠️  Keeping compatibility layer due to failed removals.');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Cleanup complete!`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files removed: ${removedFiles}`);
  console.log(`   Files failed: ${failedFiles}`);
  console.log('='.repeat(50));
  
  if (removedFiles > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Run "npm run build" to verify everything still works');
    console.log('2. Commit these changes to git');
    console.log('3. Deploy to staging for testing');
  }
}

// Run cleanup
main().catch(console.error);