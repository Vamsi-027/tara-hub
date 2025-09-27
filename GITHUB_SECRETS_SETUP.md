# GitHub Secrets Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Go to Repository Settings
1. Navigate to your GitHub repository: `https://github.com/Vamsi-027/tara-hub`
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)

### Step 2: Add Database Secret
1. Click **New repository secret**
2. Choose one option:

#### Option A: Dedicated Test Database (Recommended)
```
Name: DATABASE_URL_TEST
Value: postgresql://username:password@ep-xxx.neon.tech/test_database?sslmode=require
```

#### Option B: Shared Database
```
Name: NEON_DATABASE_URL
Value: postgresql://username:password@ep-xxx.neon.tech/database?sslmode=require
```

### Step 3: Save Secret
1. Click **Add secret**
2. Verify the secret appears in the list

## Testing the Setup

### Trigger a Test Run:
1. Make any small change to a file in `medusa/` directory
2. Commit and push to main branch
3. Go to **Actions** tab in GitHub
4. Watch the "Materials Module Tests" workflow run

### Expected Results:
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ E2E tests pass
- ✅ Total time: ~5-10 minutes

## Verification Commands

### Check Secret is Working:
The workflow will show in the logs (without revealing the secret):
```
DATABASE_URL_TEST: ***
NEON_DATABASE_URL: ***
DATABASE_URL: ***
```

### Test Locally with Same Setup:
```bash
# Use the same secret value locally
export DATABASE_URL_TEST="your_neon_url_here"
cd medusa && npm run test:e2e:materials
```

## Security Notes

- ✅ Secrets are encrypted and only visible to GitHub Actions
- ✅ Secret values never appear in logs
- ✅ Test data uses unique prefixes to avoid conflicts
- ✅ SSL connections required for all database access

## Ready!

Once you've added the secret, your automated testing is fully operational. Every push and PR will automatically run the complete test suite against your Neon database.