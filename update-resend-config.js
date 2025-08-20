// Script to update Resend configuration in Vercel with a working from address

const updateEnvVars = async () => {
  console.log(`
  The issue is that the email domain 'deepcrm.ai' might not be verified in Resend.
  
  To fix this issue, you have two options:
  
  OPTION 1: Use Resend's default domain (Recommended for testing)
  ========================================================
  Run this command to update the RESEND_FROM_EMAIL in Vercel:
  
  echo "onboarding@resend.dev" | vercel env add RESEND_FROM_EMAIL production --force
  
  Then redeploy:
  vercel --prod --yes
  
  
  OPTION 2: Verify your domain in Resend
  =====================================
  1. Go to https://resend.com/domains
  2. Add and verify 'deepcrm.ai' domain
  3. Add the DNS records as instructed
  4. Wait for verification (can take a few minutes)
  5. Keep the current configuration
  
  
  CURRENT STATUS:
  - Resend API Key: ✅ Working (tested locally)
  - Email sending: ✅ Working locally
  - Domain verification: ❌ Likely issue (deepcrm.ai not verified)
  
  The easiest fix is Option 1 - use Resend's default domain for now.
  `);
};

updateEnvVars();