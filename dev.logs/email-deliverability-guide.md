# Email Deliverability Guide for Resend API Authentication System

## Overview
This guide addresses spam filter issues with authentication emails sent via Resend API.

## Domain Authentication & Configuration

### 1. Set Up Proper Domain Authentication
- **SPF Records**: Add Resend's SPF record to your DNS
- **DKIM**: Configure DKIM signing (Resend handles this automatically)
- **DMARC**: Implement a DMARC policy starting with `p=none` and gradually moving to `p=quarantine`

### 2. Use a Dedicated Subdomain
Instead of sending from your main domain, use a subdomain:
```
auth.yourdomain.com or mail.yourdomain.com
```
This protects your main domain's reputation while you build sender reputation.

## Email Content Optimization

### 3. Improve Email Content Structure
```html
<!-- Use proper HTML structure -->
<html>
  <head>
    <meta charset="UTF-8">
    <title>Team Invitation</title>
  </head>
  <body>
    <!-- Avoid spam trigger words -->
    <!-- Include both HTML and plain text versions -->
  </body>
</html>
```

### 4. Avoid Spam Triggers
- Remove phrases like "Click the link below"
- Avoid excessive use of "free", "act now", or urgency language
- Maintain good text-to-image ratio (80% text, 20% images)
- Don't use URL shorteners

## Implementation Best Practices

### 5. Implement Magic Links Instead
Consider using magic links instead of traditional passwords:
```javascript
// Example with Resend API
const resend = new Resend('your_api_key');

await resend.emails.send({
  from: 'Team Name <noreply@auth.yourdomain.com>',
  to: user.email,
  subject: 'Sign in to Your Account',
  html: `
    <p>Hi ${user.name},</p>
    <p>You've been invited to join our team.</p>
    <p><a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `,
  text: // Always include plain text version
});
```

### 6. Implement Rate Limiting & Warming
```javascript
// Gradually increase sending volume
// Start with 50 emails/day, increase by 50% weekly
const rateLimiter = {
  maxPerHour: 20,
  maxPerDay: 200,
  warmupPeriod: 30 // days
};
```

## Technical Improvements

### 7. Add Security Headers
```javascript
await resend.emails.send({
  from: 'verified-sender@yourdomain.com',
  replyTo: 'support@yourdomain.com', // Add legitimate reply-to
  headers: {
    'X-Entity-Ref-ID': generateUniqueId(),
    'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>',
  }
});
```

### 8. Implement Proper Link Handling
```javascript
// Use full URLs, not shortened ones
const invitationLink = `https://app.yourdomain.com/invite/accept?token=${token}&email=${encodeURIComponent(email)}`;

// Add link expiration
const tokenExpiry = 3600; // 1 hour
```

## Monitoring & Maintenance

### 9. Set Up Monitoring
- Track bounce rates (keep below 2%)
- Monitor spam complaints (keep below 0.1%)
- Use Resend's webhook events to track delivery

### 10. Create a Dedicated IP Warm-up Plan
If using dedicated IPs:
- Week 1: 50 emails/day
- Week 2: 100 emails/day
- Week 3: 250 emails/day
- Week 4: 500 emails/day

## Quick Fixes for Your Current Setup

1. **Change sender name**: Instead of "Admin DeepCRM", use something like "DeepCRM Team"
2. **Improve subject line**: "Welcome to DeepCRM - Confirm Your Account"
3. **Add company branding**: Include your logo and consistent colors
4. **Include unsubscribe link**: Required by law and improves reputation
5. **Add physical address**: Include your company's physical address in the footer

## Sample Implementation

```javascript
// Improved email template
const sendInvitation = async (email, inviterName) => {
  const token = generateSecureToken();
  
  await resend.emails.send({
    from: 'DeepCRM Team <team@mail.deepcrm.com>',
    to: email,
    subject: `${inviterName} invited you to join DeepCRM`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>You're invited to DeepCRM</h2>
            <p>${inviterName} has invited you to join their team.</p>
            <div style="margin: 30px 0;">
              <a href="https://app.deepcrm.com/invite/${token}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This invitation expires in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              DeepCRM Inc.<br>
              123 Business St, Suite 100<br>
              San Francisco, CA 94102<br>
              <a href="https://deepcrm.com/unsubscribe?token=${token}">Unsubscribe</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `You're invited to DeepCRM...` // Plain text version
  });
};
```

## Additional Resources

### DNS Configuration Example
```
; SPF Record
v=spf1 include:spf.resend.com ~all

; DMARC Record
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com; fo=1
```

### Resend API Configuration
```javascript
// Initialize Resend with your API key
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure default settings
const emailConfig = {
  from: 'DeepCRM <noreply@mail.deepcrm.com>',
  replyTo: 'support@deepcrm.com',
  // Always include text version
  generateTextVersion: true,
};
```

## Troubleshooting Checklist

- [ ] SPF record configured correctly
- [ ] DKIM signing enabled
- [ ] DMARC policy in place
- [ ] Using subdomain for transactional emails
- [ ] Email includes both HTML and plain text versions
- [ ] No spam trigger words in subject or content
- [ ] Proper unsubscribe link included
- [ ] Physical address in footer
- [ ] Rate limiting implemented
- [ ] Monitoring bounce rates and complaints
- [ ] Testing with mail-tester.com or similar service

## Testing Tools

1. **Mail Tester**: https://www.mail-tester.com/
2. **MXToolbox**: https://mxtoolbox.com/deliverability
3. **Google Postmaster Tools**: https://postmaster.google.com/
4. **Microsoft SNDS**: https://sendersupport.olc.protection.outlook.com/snds/

## Notes

- Start implementation with domain authentication (SPF, DKIM, DMARC)
- Test each change with a small batch before full rollout
- Monitor metrics closely for the first 30 days
- Consider using a dedicated IP if sending volume > 100k emails/month