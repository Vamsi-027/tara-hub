import { ExecArgs } from "@medusajs/framework/types";

export default async function rawSqlCheck({ container }: ExecArgs) {
  try {
    // Get the database connection from container
    const dbConnection = container.resolve("__pg_connection__");
    
    console.log("\n=== RAW PostgreSQL QUERY ===\n");
    
    // Query the product table directly
    const result = await dbConnection.raw(`
      SELECT id, handle, title, status, deleted_at, created_at
      FROM product
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${result.rows.length} rows in product table:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Handle: ${row.handle}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Deleted: ${row.deleted_at || 'No'}`);
      console.log(`   Created: ${row.created_at}`);
      console.log("");
    });
    
    // Also check for any products with deleted_at NOT NULL
    const deletedResult = await dbConnection.raw(`
      SELECT COUNT(*) as count 
      FROM product 
      WHERE deleted_at IS NOT NULL
    `);
    
    console.log(`Products with deleted_at NOT NULL: ${deletedResult.rows[0].count}`);
    
    // Check total count including deleted
    const totalResult = await dbConnection.raw(`
      SELECT COUNT(*) as total FROM product
    `);
    
    console.log(`Total rows in product table (including any deleted): ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.error("Error executing raw SQL:", error);
    console.log("\nNote: If you're seeing 4 rows in your database client but Medusa shows 5,");
    console.log("check that you're connected to the same database:");
    console.log("Database: medusa");
    console.log("Host: ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech");
  }
}