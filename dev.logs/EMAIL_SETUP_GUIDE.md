# Email Setup Guide for Team Invitations

## 🔧 Quick Fix Checklist

1. **Check your `.env.local` file has ONE of these configurations:**

### Option 1: Resend API (Recommended)
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="Hearth & Home <noreply@yourdomain.com>"
```

### Option 2: Resend SMTP
```env
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_xxxxxxxxxxxxx
EMAIL_FROM="Hearth & Home <noreply@yourdomain.com>"
```

### Option 3: Gmail SMTP
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM="Hearth & Home <your-email@gmail.com>"
```

## 📧 Setting Up Resend (Easiest Method)

1. **Sign up at [Resend.com](https://resend.com)**
2. **Verify your domain** (or use their test domain)
3. **Get your API key** from https://resend.com/api-keys
4. **Add to `.env.local`:**
   ```env
   RESEND_API_KEY=re_your_actual_key_here
   EMAIL_FROM="Your Store <noreply@yourdomain.com>"
   ```

## 🔍 Testing Your Configuration

1. **Visit:** http://localhost:3000/api/test-email-config
   - This will show you which environment variables are set
   - Must be logged in as admin

2. **Check server logs** when sending an invitation:
   - Look for "Attempting to send email via Resend API..." or
   - "Attempting to send email via SMTP..."
   - Any errors will be logged to console

## ⚠️ Common Issues & Solutions

### Issue: "User created but email could not be sent"
**Cause:** Email configuration is missing or incorrect
**Solution:** 
- Ensure you have either `RESEND_API_KEY` or complete SMTP settings
- Check server console for specific error messages

### Issue: Gmail "Less secure app access" error
**Solution:** 
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password instead of your regular password

### Issue: Resend "Invalid API key" error
**Solution:**
- Double-check your API key starts with `re_`
- Ensure no extra spaces or quotes around the key
- Verify the key is active in Resend dashboard

### Issue: "Connection timeout" errors
**Solution:**
- Check firewall settings
- Verify SMTP port is correct (465 for SSL, 587 for TLS)
- For local development, you might need to disable TLS verification

## 🧪 Manual Email Test

You can test email sending directly:

```javascript
// In browser console (while on admin page)
fetch('/api/team/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    role: 'viewer'
  })
}).then(r => r.json()).then(console.log)
```

Check the response for:
- `emailSent: true` - Email was sent successfully
- `emailError` - Specific error message if failed

## 📝 Required Environment Variables

Your `.env.local` should include:

```env
# Always required
NEXTAUTH_URL=http://localhost:3000  # or your production URL
NEXTAUTH_SECRET=your-secret-here

# Email (choose one method)
RESEND_API_KEY=re_xxxxx  # Easiest option
# OR
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=username
EMAIL_SERVER_PASSWORD=password

# Always set this
EMAIL_FROM="Your App <noreply@yourdomain.com>"
```

## 🚀 Production Considerations

1. **Verify your domain** with Resend for better deliverability
2. **Set up SPF, DKIM, and DMARC** records
3. **Monitor bounce rates** in Resend dashboard
4. **Use a dedicated sending domain** (not your main domain)
5. **Set appropriate rate limits** to prevent abuse

## 🆘 Still Not Working?

1. **Check server logs** - The updated code logs detailed error information
2. **Verify environment variables** are loaded (restart Next.js after changes)
3. **Test with Resend's test mode** first
4. **Try the SMTP method** if API method fails
5. **Check spam folder** - Invitation might be there

## 📞 Support Resources

- **Resend Documentation:** https://resend.com/docs
- **NextAuth Email Provider:** https://next-auth.js.org/providers/email
- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833

---

Last updated: ${new Date().toISOString().split('T')[0]}