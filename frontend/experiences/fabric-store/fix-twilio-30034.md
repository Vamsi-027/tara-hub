# Fixing Twilio Error 30034 - Carrier Violation

## Problem
Your messages are being blocked with error code 30034, which means carriers are flagging your messages as potential spam.

## Immediate Solutions

### 1. Register Your Twilio Phone Number for A2P 10DLC (REQUIRED for US numbers)

**This is likely the main issue.** US carriers now require registration for Application-to-Person messaging.

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Messaging > Regulatory Compliance > A2P 10DLC**
3. Click **Register My Company**
4. Follow the registration process:
   - Business Information
   - Use Case (select "2FA/OTP")
   - Campaign Registration

**Note:** This process can take 1-3 business days for approval.

### 2. Temporary Workaround - Use Twilio Verify Service

Instead of sending raw SMS, use Twilio's Verify service which is pre-approved for OTP:

```javascript
// Instead of client.messages.create()
// Use Twilio Verify:
const verify = await client.verify.v2
  .services('YOUR_VERIFY_SERVICE_SID')
  .verifications
  .create({
    to: phoneNumber,
    channel: 'sms'
  });
```

### 3. Message Content Best Practices

✅ **DO:**
- Keep messages short and simple
- Use plain text only
- Include only necessary information

❌ **DON'T:**
- Include links (especially shortened URLs)
- Use marketing language
- Send too frequently to the same number
- Include special characters or emojis

### 4. Test with Different Carriers

Some carriers are stricter than others. Test with:
- AT&T numbers
- Verizon numbers  
- T-Mobile numbers

### 5. Check Twilio Phone Number Health

Your number might be flagged. Consider:
1. Getting a new Twilio phone number
2. Using a toll-free number (better deliverability)
3. Using a short code (best deliverability but expensive)

## Current Message Issues

Your original message:
```
Your Tara Hub verification code is: 123456. Valid for 10 minutes.
```

Simplified to:
```
Your verification code is 123456
```

## Next Steps

1. **Register for A2P 10DLC** (most important)
2. **Try the simplified message** format
3. **Consider using Twilio Verify** service for OTPs
4. **Test with different phone numbers** to see if it's carrier-specific

## Testing

Use the test script to verify:
```bash
cd frontend/experiences/fabric-store
node test-send-sms.js
```

Remember to update YOUR_PHONE_NUMBER in the script first!