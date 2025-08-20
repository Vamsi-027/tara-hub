const { Resend } = require('resend');

const resend = new Resend('re_C7yWWG1y_Fsxewcn1iUuraQx2bvb2a2Wf');

async function testEmail() {
  try {
    console.log('Testing Resend API...');
    
    const result = await resend.emails.send({
      from: 'Tara Hub Admin <admin@deepcrm.ai>',
      to: 'varaku@gmail.com',
      subject: 'Test Email from Tara Hub',
      html: '<p>This is a test email to verify Resend configuration.</p>'
    });
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testEmail();