const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testAuth() {
  console.log(`${colors.blue}🔐 Testing Authentication System Locally${colors.reset}\n`);
  
  try {
    // Test 1: Check providers
    console.log(`${colors.yellow}1. Testing Auth Providers...${colors.reset}`);
    const providersRes = await fetch(`${BASE_URL}/api/auth/providers`);
    const providers = await providersRes.json();
    console.log(`   Providers available: ${Object.keys(providers).join(', ')}`);
    console.log(`   Status: ${providersRes.ok ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
    
    // Test 2: Check session
    console.log(`\n${colors.yellow}2. Testing Session Endpoint...${colors.reset}`);
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`);
    const session = await sessionRes.json();
    console.log(`   Session status: ${session.user ? 'Authenticated' : 'Not authenticated'}`);
    if (session.user) {
      console.log(`   User: ${session.user.email}`);
      console.log(`   Role: ${session.user.role || 'N/A'}`);
    }
    console.log(`   Status: ${sessionRes.ok ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
    
    // Test 3: Check CSRF token
    console.log(`\n${colors.yellow}3. Testing CSRF Token...${colors.reset}`);
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrf = await csrfRes.json();
    console.log(`   CSRF Token: ${csrf.csrfToken ? 'Generated' : 'Failed'}`);
    console.log(`   Status: ${csrfRes.ok ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
    
    // Test 4: Check signin page
    console.log(`\n${colors.yellow}4. Testing Sign-in Page...${colors.reset}`);
    const signinRes = await fetch(`${BASE_URL}/auth/signin`);
    console.log(`   Sign-in page status: ${signinRes.status}`);
    console.log(`   Status: ${signinRes.ok ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
    
    // Test 5: Check admin page redirect
    console.log(`\n${colors.yellow}5. Testing Admin Page (should redirect if not authenticated)...${colors.reset}`);
    const adminRes = await fetch(`${BASE_URL}/admin`, {
      redirect: 'manual'
    });
    console.log(`   Admin page status: ${adminRes.status}`);
    if (adminRes.status === 307 || adminRes.status === 302) {
      console.log(`   Redirects to: ${adminRes.headers.get('location')}`);
    }
    console.log(`   Status: ${(adminRes.status === 307 || adminRes.status === 200) ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
    
    // Test 6: Check environment variables
    console.log(`\n${colors.yellow}6. Checking Environment Configuration...${colors.reset}`);
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || colors.red + 'NOT SET' + colors.reset}`);
    console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? colors.green + 'SET' : colors.red + 'NOT SET'} ${colors.reset}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? colors.green + 'SET' : colors.red + 'NOT SET'} ${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}Error during testing:${colors.reset}`, error.message);
  }
  
  console.log(`\n${colors.cyan}📋 Next Steps:${colors.reset}`);
  console.log('1. Visit http://localhost:3003/test-google-auth to test Google OAuth');
  console.log('2. Check browser console for any client-side errors');
  console.log('3. Check terminal for any server-side errors');
  console.log('4. Try signing in with varaku@gmail.com');
  console.log(`\n${colors.blue}✅ Local Auth Test Complete!${colors.reset}\n`);
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run tests
testAuth().catch(console.error);