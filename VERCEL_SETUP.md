# Vercel Deployment Setup Guide

## 🚀 Your deployment is in progress!

The code has been pushed to GitHub and Vercel should automatically deploy it. Here's how to complete the setup:

## 1. Check Deployment Status

Visit: https://vercel.com/varaku1012s-projects/tara-hub

Your deployment should be building or already live at: https://tara-hub.vercel.app

## 2. Set Up Environment Variables

### Required Variables (for authentication):

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Navigate to "Environment Variables"
4. Add these required variables:

```
NEXTAUTH_URL = https://tara-hub.vercel.app
NEXTAUTH_SECRET = [generate a secure random string]
GOOGLE_CLIENT_ID = [from Google Cloud Console]
GOOGLE_CLIENT_SECRET = [from Google Cloud Console]
```

To generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### Optional Variables (for data persistence):

To enable Vercel KV for permanent data storage:

1. In Vercel Dashboard, go to "Storage" tab
2. Click "Create Database" → Select "KV"
3. Name it (e.g., "tara-hub-kv")
4. Once created, Vercel will automatically add these env vars:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

## 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Add authorized redirect URIs:
   - `https://tara-hub.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
7. Copy the Client ID and Client Secret

## 4. Redeploy After Adding Environment Variables

After adding environment variables:
1. Go to "Deployments" tab
2. Click on the three dots menu on the latest deployment
3. Select "Redeploy"

## 5. Test Your Deployment

### Basic Testing:
1. Visit https://tara-hub.vercel.app - Should load the homepage
2. Check https://tara-hub.vercel.app/fabrics - Should show fabric collection

### Admin Testing:
1. Visit https://tara-hub.vercel.app/auth/signin
2. Login with Google (use varaku@gmail.com for admin access)
3. Access https://tara-hub.vercel.app/admin
4. Test creating:
   - Blog post at `/admin/blog`
   - Social media post at `/admin/posts`
   - Calendar events at `/admin/calendar`

## 6. Monitor Performance

In Vercel Dashboard:
- Check "Analytics" tab for performance metrics
- Monitor "Functions" tab for API usage
- Review "Logs" for any errors

## 🎯 Data Persistence Modes

### Without KV (default):
- Uses in-memory store
- Data persists during app lifecycle
- Resets on redeploy/restart
- Good for testing

### With KV (recommended for production):
- Full database persistence
- Data survives redeploys
- Scalable and reliable
- Small usage is free

## 📝 Troubleshooting

### If authentication fails:
- Verify NEXTAUTH_URL matches your deployment URL
- Check Google OAuth redirect URIs
- Ensure NEXTAUTH_SECRET is set

### If data doesn't persist:
- Without KV: This is expected (in-memory only)
- With KV: Check KV credentials in environment variables

### Build errors:
- Check deployment logs in Vercel dashboard
- Ensure all environment variables are set
- Try redeploying

## 🔗 Important URLs

- **Live Site**: https://tara-hub.vercel.app
- **Admin Panel**: https://tara-hub.vercel.app/admin
- **Vercel Dashboard**: https://vercel.com/varaku1012s-projects/tara-hub
- **GitHub Repo**: https://github.com/varaku1012/tara-hub

## ✅ Checklist

- [ ] Deployment successful on Vercel
- [ ] Environment variables added
- [ ] Google OAuth configured
- [ ] Admin login working
- [ ] Data entry tested (blog/posts)
- [ ] KV storage enabled (optional)

---

**Need help?** Check the deployment logs in Vercel dashboard or the browser console for errors.