const { exec } = require('child_process');

console.log('Running database migration...');

const child = exec('npx drizzle-kit push');

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  
  // Auto-select "create table" for new tables
  if (data.includes('create table')) {
    child.stdin.write('\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('exit', (code) => {
  console.log(`Migration completed with code ${code}`);
  process.exit(code);
});