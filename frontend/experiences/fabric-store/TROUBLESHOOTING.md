# 🔧 Checkout Troubleshooting Guide

## Common Issues and Solutions

### 🛒 Cart Issues

#### "Cart not found" Error
**Symptoms**: 
- Error message when trying to access cart
- Cart operations fail

**Solution**:
```javascript
// In browser console
sessionStorage.removeItem('medusa_cart_id')
location.reload()
```

#### Cart Not Persisting
**Symptoms**:
- Cart empties on page refresh
- Items disappear

**Check**:
1. Verify `NEXT_PUBLIC_USE_NEW_CHECKOUT=true` in `.env.local`
2. Check sessionStorage has `medusa_cart_id`
3. Verify Medusa backend is running

#### Cart Shows Wrong Currency
**Solution**:
```bash
# Run region setup script
cd medusa
node scripts/create-us-region.js
```

### 💳 Payment Issues

#### Stripe Payment Element Not Loading
**Symptoms**:
- Blank payment form
- Console errors about Stripe

**Check**:
1. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
2. Starts with `pk_test_` for test mode
3. No ad blockers interfering

**Solution**:
```bash
# Verify Stripe key
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Should output: pk_test_...
```

#### "Payment session creation failed"
**Causes**:
1. Cart is empty
2. Missing shipping address
3. Stripe not configured in Medusa

**Solution**:
```bash
# Check Medusa config
cd medusa
grep -n "stripe" medusa-config.ts

# Should show stripe in providers array
```

#### Payment Succeeds but No Order Created
**Check**:
1. Webhook secret is correct
2. Stripe CLI is forwarding webhooks
3. Check Medusa logs for webhook errors

**Solution**:
```bash
# Restart webhook forwarding
stripe listen --forward-to localhost:9000/webhooks/stripe

# Copy the new webhook secret to medusa/.env
```

### 🌐 API & Network Issues

#### CORS Errors
**Symptoms**:
- "Access-Control-Allow-Origin" errors
- API calls blocked

**Solution**:
```bash
# In medusa/.env
STORE_CORS=http://localhost:3006,http://localhost:3000
ADMIN_CORS=http://localhost:9000
```

#### 404 on API Calls
**Check**:
1. Medusa is running: `http://localhost:9000/health`
2. Correct API path: `/store/` not `/api/`
3. Publishable key header included

#### "Invalid API Key" Error
**Solution**:
```bash
# Get publishable key from Medusa
cd medusa
npx medusa utils:api-key

# Add to fabric-store/.env.local
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

### 🔄 Migration Issues

#### Both Legacy and New Checkout Running
**Symptoms**:
- Duplicate cart behavior
- Confusion between localStorage and sessionStorage

**Solution**:
```javascript
// Clear all storage
localStorage.clear()
sessionStorage.clear()
location.reload()
```

#### Feature Flags Not Working
**Check**:
```bash
# Verify environment variables
cd frontend/experiences/fabric-store
grep USE_NEW_CHECKOUT .env.local

# Should show: NEXT_PUBLIC_USE_NEW_CHECKOUT=true
```

**Note**: After changing `.env.local`, restart the dev server

### 📦 Order Issues

#### Orders Not Showing in Admin
**Check**:
1. Navigate to `http://localhost:9000/app`
2. Login with admin credentials
3. Check Orders section

**Debug**:
```bash
# Check database directly
psql $DATABASE_URL
SELECT id, email, created_at FROM "order" ORDER BY created_at DESC LIMIT 5;
```

#### Guest Order Lookup Fails
**Check**:
1. `NEXT_PUBLIC_ENABLE_GUEST_ORDER_LOOKUP=true`
2. Using correct order ID format
3. Email matches exactly

### 🚀 Performance Issues

#### Slow Checkout Page Load
**Optimize**:
1. Check network tab for slow requests
2. Verify database indexes
3. Enable Medusa Redis caching

```bash
# Enable Redis caching
cd medusa
echo "REDIS_URL=redis://localhost:6379" >> .env
```

#### Cart Operations Slow
**Check**:
1. Database connection pool size
2. Network latency to Medusa
3. Browser console for errors

### 🔐 Security Issues

#### Stripe Secret Key Warning
**If you see**: "Warning: Stripe secret key detected in frontend"

**Immediate Action**:
1. Remove any `STRIPE_SECRET_KEY` from fabric-store `.env.local`
2. Regenerate Stripe keys immediately
3. Only use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in frontend

### 📧 Email Issues

#### Order Confirmation Not Sent
**Check**:
1. Resend API key configured in Medusa
2. Email templates exist
3. Check Medusa logs for email errors

```bash
# Test Resend configuration
cd medusa
npx medusa utils:test-email
```

### 🐛 Debug Mode

Enable comprehensive debugging:

```bash
# In fabric-store/.env.local
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_ENABLE_DEBUG=true

# In medusa/.env
DEBUG=medusa:*
LOG_LEVEL=debug
```

### 📡 Monitoring

#### Check Service Health
```bash
# Medusa health
curl http://localhost:9000/health

# Fabric store health
curl http://localhost:3006/api/health

# Database connection
psql $DATABASE_URL -c "SELECT 1"
```

#### View Logs
```bash
# Medusa logs
tail -f medusa/logs/*.log

# Fabric store (in browser)
# Open DevTools > Console
# Filter by: [CartAPI]

# Stripe webhooks
stripe events list --limit 10
```

### 🆘 Emergency Rollback

If critical issues occur:

```bash
# 1. Disable new checkout immediately
cd frontend/experiences/fabric-store
echo "NEXT_PUBLIC_USE_NEW_CHECKOUT=false" >> .env.local

# 2. Restart fabric-store
npm run dev

# 3. Clear user sessions
# Users will need to re-add items to cart
```

## Getting Help

### Log Collection for Support
```bash
# Collect diagnostic info
cd frontend/experiences/fabric-store

cat > debug-info.txt << EOF
Date: $(date)
Node: $(node -v)
NPM: $(npm -v)

Environment Variables:
$(grep -E "MEDUSA|STRIPE|CHECKOUT" .env.local)

Medusa Health:
$(curl -s http://localhost:9000/health)

Recent Errors:
$(grep -i error logs/*.log | tail -20)
EOF

echo "Debug info saved to debug-info.txt"
```

### Support Channels
1. Check this guide first
2. Review CHECKOUT_TESTING_GUIDE.md
3. Check Medusa Discord: https://discord.gg/medusajs
4. Stripe Support: https://support.stripe.com

### Useful Commands Reference
```bash
# Quick health check
curl http://localhost:9000/health

# Create test cart
curl -X POST http://localhost:9000/store/carts \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_KEY" \
  -d '{"region_id": "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ"}'

# List recent orders
psql $DATABASE_URL -c "SELECT id, email, total, created_at FROM \"order\" ORDER BY created_at DESC LIMIT 5;"

# Check Stripe events
stripe events list --limit 5

# Tail Medusa logs
tail -f medusa/logs/error.log
```

---

**Remember**: 
- Always test in development first
- Keep backups before major changes
- Document any custom modifications
- Never expose secret keys in frontend code