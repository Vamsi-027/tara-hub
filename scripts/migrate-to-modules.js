#!/usr/bin/env node

/**
 * Migration Script: Move files to module-based architecture
 * Run with: node scripts/migrate-to-modules.js
 */

const fs = require('fs');
const path = require('path');

// File mapping configuration
const migrations = {
  // Authentication module
  auth: [
    { from: 'lib/auth.ts', to: 'src/modules/auth/services/auth.service.ts' },
    { from: 'lib/auth-utils.ts', to: 'src/modules/auth/utils/token.utils.ts' },
    { from: 'lib/auth-utils-jwt.ts', to: 'src/modules/auth/utils/jwt.utils.ts' },
    { from: 'lib/custom-auth.ts', to: 'src/modules/auth/services/custom-auth.service.ts' },
    { from: 'lib/auth-helpers.ts', to: 'src/modules/auth/utils/auth-helpers.ts' },
    { from: 'lib/auth-middleware.ts', to: 'src/modules/auth/middleware/auth.middleware.ts' },
    { from: 'lib/auth-schema.ts', to: 'src/modules/auth/schemas/auth.schema.ts' },
    { from: 'lib/legacy-auth-schema.ts', to: 'src/modules/auth/schemas/legacy-auth.schema.ts' },
    { from: 'components/auth/magic-link-form.tsx', to: 'src/modules/auth/components/magic-link-form.tsx' },
    { from: 'components/auth/protected-route.tsx', to: 'src/modules/auth/components/protected-route.tsx' },
    { from: 'components/auth/user-menu.tsx', to: 'src/modules/auth/components/user-menu.tsx' },
  ],

  // Fabrics module
  fabrics: [
    { from: 'lib/repositories/fabric.repository.ts', to: 'src/modules/fabrics/repositories/fabric.repository.ts' },
    { from: 'lib/repositories/fabric-image.repository.ts', to: 'src/modules/fabrics/repositories/fabric-image.repository.ts' },
    { from: 'lib/services/fabric.service.ts', to: 'src/modules/fabrics/services/fabric.service.ts' },
    { from: 'lib/db/schema/fabrics.schema.ts', to: 'src/modules/fabrics/schemas/fabric.schema.ts' },
    { from: 'lib/fabric-seed-data.ts', to: 'src/modules/fabrics/data/seed-data.ts' },
    { from: 'lib/fabric-swatch-data.ts', to: 'src/modules/fabrics/data/swatch-data.ts' },
    { from: 'lib/fabric-kv.ts', to: 'src/modules/fabrics/services/fabric-kv.service.ts' },
    { from: 'components/fabric-card.tsx', to: 'src/modules/fabrics/components/fabric-card.tsx' },
    { from: 'components/fabric-detail-page.tsx', to: 'src/modules/fabrics/components/fabric-detail-page.tsx' },
    { from: 'components/fabric-form.tsx', to: 'src/modules/fabrics/components/fabric-form.tsx' },
    { from: 'components/fabric-modal.tsx', to: 'src/modules/fabrics/components/fabric-modal.tsx' },
    { from: 'components/fabrics-listing-page.tsx', to: 'src/modules/fabrics/components/fabrics-listing-page.tsx' },
    { from: 'components/fabrics-view.tsx', to: 'src/modules/fabrics/components/fabrics-view.tsx' },
    { from: 'hooks/use-fabrics.ts', to: 'src/modules/fabrics/hooks/use-fabrics.ts' },
  ],

  // Blog module
  blog: [
    { from: 'lib/blog-data.ts', to: 'src/modules/blog/data/blog-data.ts' },
    { from: 'lib/blog-model.ts', to: 'src/modules/blog/models/blog.model.ts' },
    { from: 'components/blog-editor.tsx', to: 'src/modules/blog/components/blog-editor.tsx' },
    { from: 'components/blog-preview.tsx', to: 'src/modules/blog/components/blog-preview.tsx' },
  ],

  // Products module
  products: [
    { from: 'lib/etsy-product-model.ts', to: 'src/modules/products/models/etsy-product.model.ts' },
    { from: 'components/etsy-product-editor.tsx', to: 'src/modules/products/components/etsy-product-editor.tsx' },
    { from: 'components/etsy-featured-products.tsx', to: 'src/modules/products/components/etsy-featured-products.tsx' },
    { from: 'components/products-view.tsx', to: 'src/modules/products/components/products-view.tsx' },
    { from: 'hooks/use-products.ts', to: 'src/modules/products/hooks/use-products.ts' },
  ],

  // Core services
  core: [
    // Storage
    { from: 'lib/r2-client.ts', to: 'src/core/storage/r2/client-legacy.ts' },
    { from: 'lib/r2-client-v2.ts', to: 'src/core/storage/r2/client-v2-legacy.ts' },
    { from: 'lib/r2-client-v3.ts', to: 'src/core/storage/r2/client-v3-legacy.ts' },
    
    // Email
    { from: 'lib/email-service.ts', to: 'src/core/email/resend.service.ts' },
    { from: 'lib/email-service-optimized.ts', to: 'src/core/email/resend-optimized.service.ts' },
    { from: 'lib/email-config.ts', to: 'src/core/email/email.config.ts' },
    
    // Database
    { from: 'lib/db.ts', to: 'src/core/database/drizzle/client.ts' },
    { from: 'lib/db/client.ts', to: 'src/core/database/drizzle/db-client.ts' },
    { from: 'lib/db-schema.ts', to: 'src/core/database/schemas/index.ts' },
    
    // Cache
    { from: 'lib/kv.ts', to: 'src/core/cache/providers/vercel-kv.ts' },
    { from: 'lib/kv-client.ts', to: 'src/core/cache/providers/kv-client.ts' },
    { from: 'lib/cache/redis.ts', to: 'src/core/cache/providers/redis.ts' },
    { from: 'lib/memory-store.ts', to: 'src/core/cache/providers/memory-store.ts' },
    
    // Config
    { from: 'lib/config.ts', to: 'src/core/config/app.config.ts' },
  ],

  // Shared utilities
  shared: [
    { from: 'lib/utils.ts', to: 'src/shared/utils/index.ts' },
    { from: 'lib/types.ts', to: 'src/shared/types/index.ts' },
    { from: 'lib/navigation.ts', to: 'src/shared/utils/navigation.ts' },
    { from: 'hooks/use-toast.ts', to: 'src/shared/hooks/use-toast.ts' },
    { from: 'hooks/use-mobile.tsx', to: 'src/shared/hooks/use-mobile.tsx' },
    { from: 'hooks/use-api.ts', to: 'src/shared/hooks/use-api.ts' },
  ],
};

// Create compatibility exports
const compatibilityExports = `
// Temporary compatibility layer during migration
// This file will be removed after all imports are updated

export * from '@/src/modules/fabrics';
export * from '@/src/modules/auth';
export * from '@/src/modules/blog';
export * from '@/src/modules/products';
`;

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(from, to) {
  const fromPath = path.resolve(from);
  const toPath = path.resolve(to);
  
  if (!fs.existsSync(fromPath)) {
    console.log(`  ⚠️  Source file not found: ${from}`);
    return false;
  }
  
  ensureDirectoryExists(toPath);
  
  try {
    fs.copyFileSync(fromPath, toPath);
    console.log(`  ✅ Copied: ${from} → ${to}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to copy ${from}: ${error.message}`);
    return false;
  }
}

function createCompatibilityLayer() {
  const compatPath = path.resolve('lib/compat.ts');
  fs.writeFileSync(compatPath, compatibilityExports);
  console.log('✅ Created compatibility layer at lib/compat.ts');
}

function main() {
  console.log('🚀 Starting migration to module-based architecture...\n');
  
  let totalFiles = 0;
  let successfulMigrations = 0;
  
  for (const [module, files] of Object.entries(migrations)) {
    console.log(`\n📦 Migrating ${module} module...`);
    
    for (const { from, to } of files) {
      totalFiles++;
      if (copyFile(from, to)) {
        successfulMigrations++;
      }
    }
  }
  
  console.log('\n📝 Creating compatibility layer...');
  createCompatibilityLayer();
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Migration complete!`);
  console.log(`   Files migrated: ${successfulMigrations}/${totalFiles}`);
  console.log(`   Failed: ${totalFiles - successfulMigrations}`);
  console.log('='.repeat(50));
  
  console.log('\n📋 Next steps:');
  console.log('1. Review migrated files for any necessary adjustments');
  console.log('2. Update import statements gradually');
  console.log('3. Run tests to ensure everything works');
  console.log('4. Remove old files once migration is verified');
  console.log('5. Remove lib/compat.ts after all imports are updated');
}

// Run migration
main();