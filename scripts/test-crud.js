const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function testEndpoint(method, path, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.text();
    
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    return {
      success: response.ok,
      status: response.status,
      data: jsonData,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log(`${colors.blue}🧪 Starting CRUD Tests${colors.reset}\n`);

  // Test Blog API
  console.log(`${colors.yellow}📝 Testing Blog API...${colors.reset}`);
  
  // Test GET all blogs
  const blogsGet = await testEndpoint('GET', '/api/blog');
  console.log(`GET /api/blog: ${blogsGet.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}(${blogsGet.status || 'error'})`);
  
  // Test POST blog
  const blogPost = await testEndpoint('POST', '/api/blog', {
    title: 'Test Blog ' + Date.now(),
    content: 'Test content',
    excerpt: 'Test excerpt',
    author: 'Test Author',
    slug: 'test-' + Date.now(),
    published: true,
  });
  console.log(`POST /api/blog: ${blogPost.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}(${blogPost.status || 'error'})`);

  // Test Products API
  console.log(`\n${colors.yellow}📦 Testing Products API...${colors.reset}`);
  
  const productsGet = await testEndpoint('GET', '/api/products');
  console.log(`GET /api/products: ${productsGet.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}(${productsGet.status || 'error'})`);

  // Test Fabrics API
  console.log(`\n${colors.yellow}🧵 Testing Fabrics API...${colors.reset}`);
  
  const fabricsGet = await testEndpoint('GET', '/api/fabrics');
  console.log(`GET /api/fabrics: ${fabricsGet.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}(${fabricsGet.status || 'error'})`);

  // Test Posts API
  console.log(`\n${colors.yellow}📱 Testing Posts API...${colors.reset}`);
  
  const postsGet = await testEndpoint('GET', '/api/posts');
  console.log(`GET /api/posts: ${postsGet.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}(${postsGet.status || 'error'})`);

  // Test Auth Status
  console.log(`\n${colors.yellow}🔐 Testing Auth API...${colors.reset}`);
  
  const authGet = await testEndpoint('GET', '/api/auth/session');
  console.log(`GET /api/auth/session: ${authGet.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}(${authGet.status || 'error'})`);
  
  if (authGet.data && typeof authGet.data === 'object') {
    console.log(`  Session: ${authGet.data.user ? 'Authenticated as ' + authGet.data.user.email : 'Not authenticated'}`);
  }

  console.log(`\n${colors.blue}✅ Tests Complete!${colors.reset}`);
  console.log('\nNote: Some endpoints may return 401 if authentication is required.');
  console.log('To test authenticated endpoints, sign in at http://localhost:3003/auth/signin first.\n');
}

// Run tests
runTests().catch(console.error);