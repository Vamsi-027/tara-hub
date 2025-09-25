// Script to create admin user via API
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function createAdmin() {
  try {
    console.log('Creating admin user...\n')
    
    // Try to create admin user via the auth endpoint
    const response = await fetch(`${MEDUSA_URL}/auth/user/emailpass/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tara-hub.com',
        password: 'supersecretpassword'
      })
    })
    
    if (response.ok) {
      console.log('✅ Admin user created successfully!')
      console.log('Email: admin@tara-hub.com')
      console.log('Password: supersecretpassword')
    } else {
      const error = await response.text()
      console.log('Response status:', response.status)
      console.log('Response:', error)
      
      if (error.includes('already exists')) {
        console.log('\n⚠️ User already exists. Trying to login instead...')
        
        // Try to login
        const loginRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@tara-hub.com',
            password: 'supersecretpassword'
          })
        })
        
        if (loginRes.ok) {
          console.log('✅ Login successful! User exists and password is correct.')
        } else {
          console.log('❌ Login failed. Password might be different.')
          console.log('\nYou may need to:')
          console.log('1. Reset the password through the database')
          console.log('2. Or create a new user with different email')
        }
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message)
    console.log('\nAlternative: Run this command locally in medusa directory:')
    console.log('npx medusa user -e admin@tara-hub.com -p supersecretpassword')
  }
}

createAdmin()
