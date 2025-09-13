#!/usr/bin/env node

/**
 * Clear Medusa Products Script
 * 
 * Safely removes all product-related data from Medusa database
 * Respects foreign key constraints and preserves system data
 * 
 * Usage:
 *   npm run clear:products          # Interactive mode with confirmation
 *   npm run clear:products -- --force   # Skip confirmation (CI mode)
 *   npm run clear:products -- --dry-run # Preview what would be deleted
 *   npm run clear:products -- --export  # Export deleted IDs to JSON
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { Client } = require('pg');
const readline = require('readline');
const fs = require('fs').promises;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  export: args.includes('--export'),
  verbose: args.includes('--verbose') || args.includes('-v')
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Log helpers
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  debug: (msg) => options.verbose && console.log(`${colors.gray}[DEBUG]${colors.reset} ${msg}`)
};

/**
 * Tables to clear in order (respects foreign key constraints)
 * Order is important - child tables must be cleared before parent tables
 */
const TABLES_TO_CLEAR = [
  // Inventory tables
  { name: 'inventory_level', idColumn: 'id' },
  { name: 'inventory_item', idColumn: 'id' },
  
  // Pricing tables
  { name: 'price_rule', idColumn: 'id' },
  { name: 'price', idColumn: 'id' },
  { name: 'price_list', idColumn: 'id' },
  
  // Product variant related
  { name: 'product_option_value', idColumn: 'id' },
  { name: 'product_variant', idColumn: 'id' },
  { name: 'product_option', idColumn: 'id' },
  
  // Product associations
  { name: 'product_to_tag', idColumn: null }, // Junction table
  { name: 'product_tag', idColumn: 'id' },
  { name: 'product_type', idColumn: 'id' },
  { name: 'product_collection', idColumn: 'id' },
  { name: 'product_to_category', idColumn: null }, // Junction table
  { name: 'product_category', idColumn: 'id' },
  
  // Main product table
  { name: 'product', idColumn: 'id' }
];

/**
 * Connect to PostgreSQL database
 */
async function connectToDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Add SSL mode if not present
  const sslConnectionString = connectionString.includes('sslmode=') 
    ? connectionString 
    : connectionString + (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';

  const client = new Client({
    connectionString: sslConnectionString
  });

  await client.connect();
  return client;
}

/**
 * Check if table exists in database
 */
async function tableExists(client, tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `;
  
  const result = await client.query(query, [tableName]);
  return result.rows[0].exists;
}

/**
 * Get count of records in a table
 */
async function getTableCount(client, tableName) {
  try {
    const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    log.debug(`Error counting ${tableName}: ${error.message}`);
    return 0;
  }
}

/**
 * Export IDs from table before deletion
 */
async function exportTableIds(client, tableName, idColumn) {
  if (!idColumn) return [];
  
  try {
    const result = await client.query(`SELECT ${idColumn} FROM ${tableName}`);
    return result.rows.map(row => row[idColumn]);
  } catch (error) {
    log.debug(`Error exporting IDs from ${tableName}: ${error.message}`);
    return [];
  }
}

/**
 * Clear a single table
 */
async function clearTable(client, tableName) {
  try {
    await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    return true;
  } catch (error) {
    // Try DELETE if TRUNCATE fails
    try {
      await client.query(`DELETE FROM ${tableName}`);
      return true;
    } catch (deleteError) {
      log.error(`Failed to clear ${tableName}: ${deleteError.message}`);
      return false;
    }
  }
}

/**
 * Prompt user for confirmation
 */
async function confirmAction(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${message} (yes/no): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main execution function
 */
async function main() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}    Medusa Product Data Cleanup Tool${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);

  let client;
  const exportData = {};
  const stats = {
    tablesCleared: 0,
    recordsDeleted: 0,
    errors: 0
  };

  try {
    // Connect to database
    log.info('Connecting to database...');
    client = await connectToDatabase();
    log.success('Connected to database');

    // Check what data exists
    log.info('\nAnalyzing product data...');
    let totalRecords = 0;
    const tableCounts = {};

    for (const table of TABLES_TO_CLEAR) {
      if (await tableExists(client, table.name)) {
        const count = await getTableCount(client, table.name);
        tableCounts[table.name] = count;
        totalRecords += count;
        
        if (count > 0) {
          console.log(`  ${colors.gray}•${colors.reset} ${table.name}: ${colors.yellow}${count}${colors.reset} records`);
        }
      }
    }

    if (totalRecords === 0) {
      log.info('\nNo product data found to clear.');
      return;
    }

    console.log(`\n${colors.yellow}Total records to be deleted: ${totalRecords}${colors.reset}`);

    // Dry run mode - just show what would be deleted
    if (options.dryRun) {
      log.info('\n🔍 DRY RUN MODE - No data will be deleted');
      return;
    }

    // Confirm action if not forced
    if (!options.force) {
      const confirmed = await confirmAction(
        `\n⚠️  This will permanently delete all product data. Are you sure?`
      );
      
      if (!confirmed) {
        log.warning('Operation cancelled by user');
        return;
      }
    }

    // Export data if requested
    if (options.export) {
      log.info('\nExporting product IDs for rollback reference...');
      
      for (const table of TABLES_TO_CLEAR) {
        if (await tableExists(client, table.name) && table.idColumn) {
          const ids = await exportTableIds(client, table.name, table.idColumn);
          if (ids.length > 0) {
            exportData[table.name] = ids;
            log.debug(`Exported ${ids.length} IDs from ${table.name}`);
          }
        }
      }
    }

    // Begin transaction
    log.info('\nStarting deletion process...');
    await client.query('BEGIN');

    // Clear tables in order
    for (const table of TABLES_TO_CLEAR) {
      if (await tableExists(client, table.name)) {
        const count = tableCounts[table.name] || 0;
        
        if (count > 0) {
          process.stdout.write(`  Clearing ${table.name}...`);
          
          const success = await clearTable(client, table.name);
          
          if (success) {
            console.log(` ${colors.green}✓${colors.reset} (${count} records)`);
            stats.tablesCleared++;
            stats.recordsDeleted += count;
          } else {
            console.log(` ${colors.red}✗${colors.reset}`);
            stats.errors++;
          }
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    log.success('Transaction committed successfully');

    // Save export data if requested
    if (options.export && Object.keys(exportData).length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportPath = path.join(process.cwd(), `product-backup-${timestamp}.json`);
      
      await fs.writeFile(exportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        stats,
        deletedIds: exportData
      }, null, 2));
      
      log.success(`Backup saved to: ${exportPath}`);
    }

    // Summary
    console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                 Summary${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
    console.log(`  Tables cleared: ${colors.green}${stats.tablesCleared}${colors.reset}`);
    console.log(`  Records deleted: ${colors.yellow}${stats.recordsDeleted}${colors.reset}`);
    
    if (stats.errors > 0) {
      console.log(`  Errors: ${colors.red}${stats.errors}${colors.reset}`);
    }
    
    log.success('\n✨ Product data cleared successfully!\n');

  } catch (error) {
    log.error(`Failed to clear product data: ${error.message}`);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
        log.info('Transaction rolled back');
      } catch (rollbackError) {
        log.error(`Rollback failed: ${rollbackError.message}`);
      }
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };