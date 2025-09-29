#!/usr/bin/env node
/**
 * Minimal Standalone Seed Script
 *
 * This script bypasses the medusa CLI and runs directly against the database.
 * It creates the absolute minimum needed for a functioning Medusa store.
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL or POSTGRES_URL environment variable is required!');
    process.exit(1);
}

async function seedMinimal() {
    const client = new Client({ connectionString: DATABASE_URL });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');

        // Check if store already exists
        const { rows: stores } = await client.query('SELECT * FROM store LIMIT 1');

        if (stores.length > 0) {
            console.log('ℹ️  Store already exists. Database has been seeded.');
            console.log('   Store ID:', stores[0].id);
            return;
        }

        console.log('\n🌱 Starting minimal database seeding...\n');

        // This is a placeholder - actual seeding requires complex Medusa workflows
        // For now, inform the user they need to use the Admin UI
        console.log('⚠️  IMPORTANT:');
        console.log('   Direct database seeding is not recommended for Medusa v2.');
        console.log('   The seed scripts require the Medusa framework context.');
        console.log('');
        console.log('📝 Recommended Actions:');
        console.log('');
        console.log('1. Access the Medusa Admin UI:');
        console.log('   https://medusa-backend-production-3655.up.railway.app/app');
        console.log('');
        console.log('2. Set up regions manually:');
        console.log('   - Go to Settings → Regions');
        console.log('   - Create "United States" region with USD currency');
        console.log('');
        console.log('3. Create products:');
        console.log('   - Go to Products → Add Product');
        console.log('   - Create your fabric products manually');
        console.log('');
        console.log('4. Alternative: Deploy code with seed scripts to Railway,');
        console.log('   then run: railway run npm run seed');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

seedMinimal()
    .then(() => {
        console.log('\n✅ Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });