# 🚀 Redis Quick Setup Guide

## Copy these exact values to your `.env.local` file:

```env
# ========== REDIS/KV DATABASE (REQUIRED) ==========
KV_REST_API_URL=https://excited-emu-38074.upstash.io
KV_REST_API_TOKEN=AZS6AAIncDFiY2Q2YzgwNTA0NmQ0OWJhYWJkNmU2MjBmMGZmNmVkMHAxMzgwNzQ
KV_REST_API_READ_ONLY_TOKEN=ApS6AAIgcDFtg72IFRmeaXnHUaMIAHyoKQfx11-o_hfnTu39bMsdwg

# Redis URLs (for compatibility)
KV_URL=rediss://default:AZS6AAIncDFiY2Q2YzgwNTA0NmQ0OWJhYWJkNmU2MjBmMGZmNmVkMHAxMzgwNzQ@excited-emu-38074.upstash.io:6379
REDIS_URL=rediss://default:AZS6AAIncDFiY2Q2YzgwNTA0NmQ0OWJhYWJkNmU2MjBmMGZmNmVkMHAxMzgwNzQ@excited-emu-38074.upstash.io:6379

# Alternative names (some packages look for these)
UPSTASH_REDIS_REST_URL=https://excited-emu-38074.upstash.io
UPSTASH_REDIS_REST_TOKEN=AZS6AAIncDFiY2Q2YzgwNTA0NmQ0OWJhYWJkNmU2MjBmMGZmNmVkMHAxMzgwNzQ
```

## ✅ Setup Steps:

1. **Open/Create** `.env.local` in your project root
2. **Copy** the entire block above
3. **Paste** it into your `.env.local` file
4. **Save** the file
5. **Restart** your Next.js server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

## 🧪 Test Your Connection:

After restarting, visit:
```
http://localhost:3000/api/test-kv
```

You should see:
```json
{
  "status": "connected",
  "message": "KV/Redis connection successful",
  "endpoint": "excited-emu-38074"
}
```

## 🎯 What This Enables:

✅ **Persistent Data Storage** - Data survives server restarts
✅ **Fabric Inventory** - Store and manage fabric data
✅ **Blog Posts** - Persistent blog content
✅ **Product Catalog** - Product information storage
✅ **Team Management** - Store team member data
✅ **Admin Dashboard** - All admin panel data persisted

## ⚠️ Important Notes:

- **Never commit** `.env.local` to Git
- **Always restart** Next.js after changing environment variables
- Your Redis instance: `excited-emu-38074.upstash.io`
- Read-only token is included for secure read operations

## 🔍 Troubleshooting:

If connection fails:
1. Check all variables are copied correctly (no extra spaces)
2. Ensure you restarted the Next.js server
3. Check console logs for specific error messages
4. Verify your Upstash dashboard shows the database is active

---
*Redis endpoint: excited-emu-38074.upstash.io*