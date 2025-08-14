// Load environment variables
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Email Configuration:');
  console.log('Host:', process.env.EMAIL_SERVER_HOST);
  console.log('Port:', process.env.EMAIL_SERVER_PORT);
  console.log('User:', process.env.EMAIL_SERVER_USER);
  console.log('From:', process.env.EMAIL_FROM);
  console.log('---');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: true, // true for port 465 (Resend uses SSL)
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      }
    });

    console.log('Verifying SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP Server is ready to take our messages');

    // Send test email
    console.log('\nSending test email...');
    const testRecipient = 'admin@deepcrm.ai'; // Send to your email
    console.log('Sending to:', testRecipient);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: testRecipient,
      subject: 'Test Email - Tara Hub',
      text: 'This is a test email from Tara Hub to verify Resend email configuration.',
      html: '<h2>Test Email</h2><p>This is a test email from <b>Tara Hub</b> to verify Resend email configuration.</p><p>If you received this, your email setup is working correctly!</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.responseCode === 535) {
      console.log('\n📝 Authentication failed. Possible solutions:');
      console.log('1. Verify your email and password are correct');
      console.log('2. Enable "Authenticated SMTP" in Microsoft 365 admin center');
      console.log('3. If using 2FA, create an app password at:');
      console.log('   https://account.microsoft.com/security');
    }
    
    if (error.code === 'EAUTH') {
      console.log('\n📝 Authentication error. Your Microsoft 365 account may require:');
      console.log('1. An app-specific password instead of your regular password');
      console.log('2. SMTP authentication to be explicitly enabled');
    }
  }
}

testEmail();