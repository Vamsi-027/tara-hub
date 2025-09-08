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

console.log('Twilio Configuration:');
console.log('Account SID:', accountSid?.substring(0, 10) + '...');
console.log('Auth Token:', authToken ? 'Set' : 'Not set');
console.log('Phone Number:', twilioPhoneNumber);

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('❌ Missing Twilio configuration');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function testTwilio() {
  try {
    // First, let's verify the account
    console.log('\n🔍 Verifying Twilio account...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log('Account Status:', account.status);
    console.log('Account Type:', account.type);
    
    // Check phone numbers
    console.log('\n📞 Checking phone numbers...');
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    console.log('Available phone numbers:', phoneNumbers.length);
    phoneNumbers.forEach(number => {
      console.log(`  - ${number.phoneNumber} (${number.status})`);
    });
    
    // Test message to a verified number (you need to replace this)
    const testPhoneNumber = '+12345678901'; // ⚠️ REPLACE WITH YOUR VERIFIED NUMBER
    
    console.log(`\n📨 Attempting to send test SMS to ${testPhoneNumber}...`);
    console.log('⚠️  NOTE: If you\'re on a trial account, this number must be verified first!');
    
    // Uncomment the lines below and replace the phone number to test
    /*
    const message = await client.messages.create({
      body: 'Test message from Tara Hub - Twilio integration working!',
      from: twilioPhoneNumber,
      to: testPhoneNumber  // Replace with your verified phone number
    });
    
    console.log('✅ Message sent successfully!');
    console.log('Message SID:', message.sid);
    */
    
  } catch (error) {
    console.error('❌ Twilio test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Status:', error.status);
    
    if (error.code === 21614) {
      console.log('\n💡 Solution: This phone number is not verified. ');
      console.log('   Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('   and verify the phone number you want to send to.');
    }
  }
}

testTwilio();