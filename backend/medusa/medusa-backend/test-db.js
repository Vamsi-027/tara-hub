const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  // Try different connection strings
  const connectionStrings = [
    { name: 'POSTGRES_URL_NON_POOLING', url: process.env.POSTGRES_URL_NON_POOLING },
    { name: 'DATABASE_URL', url: process.env.DATABASE_URL },
    { name: 'POSTGRES_URL', url: process.env.POSTGRES_URL },
  ];

  for (const { name, url } of connectionStrings) {
    if (!url) {
      console.log(`❌ ${name} not set`);
      continue;
    }

    console.log(`\n📝 Testing ${name}...`);
    const client = new Client({
      connectionString: url,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      const res = await client.query('SELECT NOW()');
      console.log(`✅ ${name} works! Server time:`, res.rows[0].now);
      await client.end();
    } catch (err) {
      console.error(`❌ ${name} failed:`, err.message);
    }
  }
}

testConnection().then(() => {
  console.log('\n✨ Database connection test complete');
}).catch(err => {
  console.error('Test failed:', err);
});