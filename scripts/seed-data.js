#!/usr/bin/env node

/**
 * Database Seeding Script for Tara Hub Admin
 * 
 * Seeds initial data for fabrics, users, and other entities
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Import schemas
const { users } = require('../lib/auth-schema');
const fabricSeedData = require('../lib/fabric-seed-data');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

class DatabaseSeeder {
  constructor() {
    this.connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!this.connectionString) {
      log.error('No database connection string found!');
      log.info('Please set DATABASE_URL or POSTGRES_URL in .env.local');
      process.exit(1);
    }
    
    // Initialize database connection
    this.sql = postgres(this.connectionString);
    this.db = drizzle(this.sql);
  }

  async run(options = {}) {
    try {
      log.info('Starting database seeding...');
      
      // Seed different data types based on options
      if (options.all || options.users) {
        await this.seedUsers();
      }
      
      if (options.all || options.fabrics) {
        await this.seedFabrics();
      }
      
      if (options.all || options.test) {
        await this.seedTestData();
      }
      
      log.success('Database seeding completed!');
      
    } catch (error) {
      log.error('Seeding failed: ' + error.message);
      console.error(error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async seedUsers() {
    log.info('Seeding admin users...');
    
    const adminUsers = [
      {
        email: 'varaku@gmail.com',
        name: 'Admin User',
        emailVerified: new Date(),
        image: null
      },
      {
        email: 'batchu.kedareswaraabhinav@gmail.com',
        name: 'Kedar Abhinav',
        emailVerified: new Date(),
        image: null
      },
      {
        email: 'vamsicheruku027@gmail.com',
        name: 'Vamsi Cheruku',
        emailVerified: new Date(),
        image: null
      },
      {
        email: 'admin@deepcrm.ai',
        name: 'System Admin',
        emailVerified: new Date(),
        image: null
      }
    ];
    
    let created = 0;
    let skipped = 0;
    
    for (const user of adminUsers) {
      try {
        // Check if user exists
        const existing = await this.db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        
        if (existing.length > 0) {
          log.warning(`User already exists: ${user.email}`);
          skipped++;
        } else {
          await this.db.insert(users).values(user);
          log.success(`Created user: ${user.email}`);
          created++;
        }
      } catch (error) {
        log.error(`Failed to create user ${user.email}: ${error.message}`);
      }
    }
    
    log.info(`Users: ${created} created, ${skipped} skipped`);
  }

  async seedFabrics() {
    log.info('Seeding fabric data...');
    
    // Check if we should use KV or database
    const useKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
    
    if (useKV) {
      await this.seedFabricsToKV();
    } else {
      await this.seedFabricsToDatabase();
    }
  }

  async seedFabricsToKV() {
    log.info('Seeding fabrics to Vercel KV...');
    
    try {
      const { kv } = require('@vercel/kv');
      
      // Get fabric data
      const fabrics = fabricSeedData.getFabrics();
      
      // Store in KV
      for (const fabric of fabrics) {
        await kv.hset(`fabric:${fabric.id}`, fabric);
        log.success(`Stored fabric: ${fabric.name}`);
      }
      
      // Update fabric list
      const fabricIds = fabrics.map(f => f.id);
      await kv.set('fabric:ids', fabricIds);
      
      log.success(`Seeded ${fabrics.length} fabrics to KV`);
      
    } catch (error) {
      log.error('Failed to seed to KV: ' + error.message);
      log.info('Falling back to database seeding...');
      await this.seedFabricsToDatabase();
    }
  }

  async seedFabricsToDatabase() {
    log.info('Seeding fabrics to PostgreSQL...');
    
    try {
      // Create fabrics table if not exists
      await this.sql`
        CREATE TABLE IF NOT EXISTS fabrics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          subcategory TEXT,
          brand TEXT,
          sku TEXT UNIQUE,
          material_composition JSONB,
          weight_gsm INTEGER,
          width_inches DECIMAL(10,2),
          price_per_meter DECIMAL(10,2),
          currency TEXT DEFAULT 'USD',
          stock_quantity INTEGER DEFAULT 0,
          minimum_order_quantity INTEGER DEFAULT 1,
          color TEXT,
          pattern TEXT,
          texture TEXT,
          weave_type TEXT,
          finish TEXT,
          durability_rating INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Get fabric data
      const fabrics = fabricSeedData.getFabrics();
      
      let created = 0;
      let skipped = 0;
      
      for (const fabric of fabrics) {
        try {
          // Check if fabric exists
          const existing = await this.sql`
            SELECT id FROM fabrics WHERE id = ${fabric.id} LIMIT 1
          `;
          
          if (existing.length > 0) {
            log.warning(`Fabric already exists: ${fabric.name}`);
            skipped++;
          } else {
            await this.sql`
              INSERT INTO fabrics (
                id, name, description, category, subcategory,
                brand, sku, material_composition, weight_gsm,
                width_inches, price_per_meter, currency,
                stock_quantity, minimum_order_quantity,
                color, pattern, texture, weave_type, finish,
                durability_rating, is_active
              ) VALUES (
                ${fabric.id}, ${fabric.name}, ${fabric.description},
                ${fabric.category}, ${fabric.subcategory},
                ${fabric.brand}, ${fabric.sku},
                ${JSON.stringify(fabric.materialComposition)},
                ${fabric.weightGSM}, ${fabric.widthInches},
                ${fabric.pricePerMeter}, ${fabric.currency},
                ${fabric.stockQuantity}, ${fabric.minimumOrderQuantity},
                ${fabric.color}, ${fabric.pattern}, ${fabric.texture},
                ${fabric.weaveType}, ${fabric.finish},
                ${fabric.durabilityRating}, ${fabric.isActive}
              )
            `;
            log.success(`Created fabric: ${fabric.name}`);
            created++;
          }
        } catch (error) {
          log.error(`Failed to create fabric ${fabric.name}: ${error.message}`);
        }
      }
      
      log.info(`Fabrics: ${created} created, ${skipped} skipped`);
      
    } catch (error) {
      log.error('Failed to seed fabrics to database: ' + error.message);
      throw error;
    }
  }

  async seedTestData() {
    log.info('Seeding test data...');
    
    // Add blog posts
    try {
      await this.sql`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content TEXT,
          excerpt TEXT,
          author TEXT,
          status TEXT DEFAULT 'draft',
          published_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      const testPosts = [
        {
          title: 'Welcome to Tara Hub',
          slug: 'welcome-to-tara-hub',
          content: 'Welcome to our fabric marketplace...',
          excerpt: 'An introduction to Tara Hub',
          author: 'Admin',
          status: 'published',
          published_at: new Date()
        },
        {
          title: 'Fabric Care Guide',
          slug: 'fabric-care-guide',
          content: 'Learn how to properly care for different fabric types...',
          excerpt: 'Essential fabric care tips',
          author: 'Admin',
          status: 'published',
          published_at: new Date()
        }
      ];
      
      for (const post of testPosts) {
        const existing = await this.sql`
          SELECT id FROM blog_posts WHERE slug = ${post.slug} LIMIT 1
        `;
        
        if (existing.length === 0) {
          await this.sql`
            INSERT INTO blog_posts (
              title, slug, content, excerpt, author, status, published_at
            ) VALUES (
              ${post.title}, ${post.slug}, ${post.content},
              ${post.excerpt}, ${post.author}, ${post.status},
              ${post.published_at}
            )
          `;
          log.success(`Created blog post: ${post.title}`);
        }
      }
      
    } catch (error) {
      log.warning('Could not seed blog posts: ' + error.message);
    }
    
    log.success('Test data seeded');
  }

  async cleanup() {
    log.info('Cleaning up database connections...');
    if (this.sql) {
      await this.sql.end();
    }
    log.success('Cleanup completed');
  }

  async reset(options = {}) {
    log.warning('⚠️  This will delete all data from the database!');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('Are you sure? Type "yes" to confirm: ', resolve);
    });
    readline.close();
    
    if (answer !== 'yes') {
      log.info('Reset cancelled');
      return;
    }
    
    log.warning('Resetting database...');
    
    try {
      // Drop tables
      if (options.fabrics || options.all) {
        await this.sql`DROP TABLE IF EXISTS fabrics CASCADE`;
        log.success('Dropped fabrics table');
      }
      
      if (options.users || options.all) {
        await this.sql`DROP TABLE IF EXISTS users CASCADE`;
        await this.sql`DROP TABLE IF EXISTS sessions CASCADE`;
        await this.sql`DROP TABLE IF EXISTS accounts CASCADE`;
        log.success('Dropped auth tables');
      }
      
      if (options.all) {
        await this.sql`DROP TABLE IF EXISTS blog_posts CASCADE`;
        log.success('Dropped blog_posts table');
      }
      
      // Clear KV if configured
      if (process.env.KV_REST_API_URL) {
        try {
          const { kv } = require('@vercel/kv');
          const keys = await kv.keys('*');
          for (const key of keys) {
            await kv.del(key);
          }
          log.success('Cleared KV store');
        } catch (error) {
          log.warning('Could not clear KV: ' + error.message);
        }
      }
      
      log.success('Database reset completed');
      
    } catch (error) {
      log.error('Reset failed: ' + error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Tara Hub Admin - Database Seeder

Usage: node seed-data.js [options]

Options:
  --all        Seed all data types
  --users      Seed admin users only
  --fabrics    Seed fabric data only
  --test       Seed test data only
  --reset      Reset database (DANGEROUS!)
  --help       Show this help message

Examples:
  node seed-data.js --all              # Seed everything
  node seed-data.js --users --fabrics  # Seed users and fabrics
  node seed-data.js --reset --all      # Reset and reseed everything
    `);
    process.exit(0);
  }
  
  const options = {
    all: args.includes('--all'),
    users: args.includes('--users'),
    fabrics: args.includes('--fabrics'),
    test: args.includes('--test'),
    reset: args.includes('--reset')
  };
  
  // Default to all if no specific options
  if (!options.users && !options.fabrics && !options.test && !options.reset) {
    options.all = true;
  }
  
  (async () => {
    if (options.reset) {
      await seeder.reset(options);
      if (args.includes('--seed-after-reset')) {
        await seeder.run(options);
      }
    } else {
      await seeder.run(options);
    }
  })();
}

module.exports = DatabaseSeeder;