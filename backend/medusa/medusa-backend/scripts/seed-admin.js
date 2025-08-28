const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedAdmin() {
  try {
    console.log('Creating admin user...');
    
    // Make a request to create admin user
    const response = await fetch('http://localhost:9000/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tara-hub.com',
        password: 'supersecretpassword',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create admin user:', error);
      
      // Try alternative approach - directly through auth endpoint
      console.log('Trying alternative approach...');
      const authResponse = await fetch('http://localhost:9000/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@tara-hub.com',
          password: 'supersecretpassword'
        })
      });
      
      if (authResponse.ok) {
        console.log('Admin user might already exist. Try logging in.');
      } else {
        console.log('Could not verify admin user.');
      }
    } else {
      console.log('Admin user created successfully!');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure Medusa is running on port 9000');
    console.log('You can also try creating the user through the Medusa CLI:');
    console.log('npx medusa user -e admin@tara-hub.com -p supersecretpassword');
  }
}

seedAdmin();