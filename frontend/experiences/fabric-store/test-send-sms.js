const twilio = require('twilio');

// Load environment variables manually
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.local');

const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const accountSid = env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;

console.log('🔧 Twilio Configuration:');
console.log('Account SID:', accountSid?.substring(0, 10) + '...');
console.log('From Number:', twilioPhoneNumber);
console.log('');

// IMPORTANT: Replace this with your actual phone number
const YOUR_PHONE_NUMBER = '+1234567890'; // <-- CHANGE THIS TO YOUR PHONE NUMBER

async function sendTestSMS() {
  if (YOUR_PHONE_NUMBER === '+1234567890') {
    console.error('❌ Please edit this file and replace YOUR_PHONE_NUMBER with your actual phone number!');
    console.log('   Example: const YOUR_PHONE_NUMBER = \'+14155551234\';');
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);
  
  try {
    console.log(`📱 Sending test SMS to ${YOUR_PHONE_NUMBER}...`);
    
    const message = await client.messages.create({
      body: `Test OTP from Tara Hub: ${Math.floor(100000 + Math.random() * 900000)}. This is a test message.`,
      from: twilioPhoneNumber,
      to: YOUR_PHONE_NUMBER
    });
    
    console.log('✅ Message sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Date Created:', message.dateCreated);
    console.log('Direction:', message.direction);
    console.log('Price:', message.price, message.priceUnit);
    
    // Check message status after a delay
    setTimeout(async () => {
      const updatedMessage = await client.messages(message.sid).fetch();
      console.log('\n📊 Message Status Update:');
      console.log('Status:', updatedMessage.status);
      console.log('Error Code:', updatedMessage.errorCode || 'None');
      console.log('Error Message:', updatedMessage.errorMessage || 'None');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Failed to send SMS:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('More Info:', error.moreInfo);
    console.error('Status:', error.status);
    
    // Common error solutions
    if (error.code === 21211) {
      console.log('\n💡 Solution: Invalid "To" phone number. Make sure the number:');
      console.log('   - Includes country code (e.g., +1 for US)');
      console.log('   - Has no spaces or special characters except +');
      console.log('   - Is a valid, active phone number');
    } else if (error.code === 21608) {
      console.log('\n💡 Solution: The number is unverified. For trial accounts:');
      console.log('   1. Go to https://console.twilio.com/');
      console.log('   2. Navigate to Phone Numbers → Verified Caller IDs');
      console.log('   3. Add and verify this phone number');
    } else if (error.code === 21610) {
      console.log('\n💡 Solution: The recipient has unsubscribed from your messages.');
      console.log('   The number may have texted STOP to your Twilio number.');
    } else if (error.code === 21614) {
      console.log('\n💡 Solution: The "To" number is not a valid mobile number.');
      console.log('   Twilio cannot send SMS to this number (might be a landline).');
    }
  }
}

sendTestSMS();