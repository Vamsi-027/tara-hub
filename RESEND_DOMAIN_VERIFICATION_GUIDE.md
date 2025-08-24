# Resend Domain Verification Guide

## Step 1: Access Resend Domain Settings

1. Go to now, i
2. Click "Add Domain"
3. Enter your domain (choose one):
   - `deepcrm.ai` (if you control this domain)
   - `gemini-us.com` (if you control this domain)
   - Or any domain you own

## Step 2: Add DNS Records

After adding your domain, Resend will show you DNS records to add. You'll need to add these to your domain's DNS settings (usually in your domain registrar like GoDaddy, Namecheap, Cloudflare, etc.)

### Required DNS Records:

#### 1. SPF Record (Sender Policy Framework)
**Type:** TXT  
**Name:** @ (or leave blank for root domain)  
**Value:** `v=spf1 include:amazonses.com ~all`

*If you already have an SPF record, modify it to include Resend:*
```
v=spf1 include:amazonses.com include:_spf.google.com ~all
```

#### 2. DKIM Records (DomainKeys Identified Mail)
Resend will provide 3 CNAME records that look like:

**Record 1:**
- **Type:** CNAME
- **Name:** `resend._domainkey`
- **Value:** `resend._domainkey.your-domain.com.dkim.amazonses.com`

**Record 2:**
- **Type:** CNAME  
- **Name:** `resend2._domainkey`
- **Value:** `resend2._domainkey.your-domain.com.dkim.amazonses.com`

**Record 3:**
- **Type:** CNAME
- **Name:** `resend3._domainkey`
- **Value:** `resend3._domainkey.your-domain.com.dkim.amazonses.com`

#### 3. DMARC Record (Optional but Recommended)
**Type:** TXT  
**Name:** `_dmarc`  
**Value:** `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`

This starts with a "none" policy. Once comfortable, you can change to:
- `p=quarantine` - Suspicious emails go to spam
- `p=reject` - Suspicious emails are rejected

## Step 3: Verify in Resend

1. After adding DNS records, wait 5-10 minutes
2. Go back to https://resend.com/domains
3. Click "Verify DNS Records" next to your domain
4. You should see green checkmarks for each record

## Step 4: Update Your Application

Once verified, update your environment variable:

**Local (.env.local):**
```env
RESEND_FROM_EMAIL="Tara Hub <noreply@yourdomain.com>"
```

**Production (Vercel):**
```bash
vercel env rm RESEND_FROM_EMAIL production --yes
printf "Tara Hub <noreply@yourdomain.com>" | vercel env add RESEND_FROM_EMAIL production
vercel --prod --yes
```

## Step 5: Common DNS Providers Instructions

### Cloudflare
1. Log in to Cloudflare
2. Select your domain
3. Go to DNS tab
4. Click "Add Record"
5. Add each record from Step 2
6. Ensure proxy is OFF (DNS only) for email records

### GoDaddy
1. Log in to GoDaddy
2. Go to "My Products" → Domain → DNS
3. Click "Add" for each record
4. Enter the details from Step 2
5. Save changes

### Namecheap
1. Log in to Namecheap
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Add New Record for each
5. Save all changes

### Google Domains
1. Log in to Google Domains
2. Select your domain
3. Go to DNS → Manage custom records
4. Add each record from Step 2
5. Save

## Step 6: Test Email Delivery

After verification, test your email:

```bash
# Test locally
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'

# Test production
curl -X POST https://thhs-fabrics.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

## Troubleshooting

### DNS Not Verifying?
- Wait up to 48 hours for DNS propagation
- Check DNS with: `nslookup -type=TXT yourdomain.com`
- Ensure no typos in DNS records

### Still Going to Spam?
- Add DMARC record
- Warm up your domain by sending gradually
- Include unsubscribe links
- Avoid spam trigger words

### Microsoft Still Blocking?
After domain verification:
1. Register with Microsoft SNDS: https://sendersupport.olc.protection.outlook.com/snds/
2. Request IP allowlisting
3. Join Microsoft Junk Email Reporting Program (JMRP)

## Benefits After Verification

✅ **No more quarantine** - Emails bypass spam filters  
✅ **"Verified sender" badge** - Shows authenticated sender  
✅ **Better deliverability** - Higher inbox placement  
✅ **Brand protection** - Prevents email spoofing  
✅ **Analytics** - Track email delivery metrics  

## Quick Verification Checklist

- [ ] Domain added to Resend
- [ ] SPF record added
- [ ] DKIM records added (all 3)
- [ ] DMARC record added (optional)
- [ ] DNS records verified in Resend
- [ ] Environment variable updated
- [ ] Application redeployed
- [ ] Test email sent successfully
- [ ] Email received in inbox (not spam)

## Support

- **Resend Support**: https://resend.com/docs
- **DNS Checker Tool**: https://mxtoolbox.com/
- **SPF Checker**: https://www.dmarcanalyzer.com/spf-checker/
- **DKIM Checker**: https://www.dmarcanalyzer.com/dkim-checker/