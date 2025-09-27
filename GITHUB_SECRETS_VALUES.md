# GitHub Secrets - Exact Values for Your Neon Database

## 🔐 Copy These Values to GitHub Secrets

### Go to: Repository Settings → Secrets and variables → Actions → New repository secret

---

### **Option A: Use Production Database for Testing (Quick Setup)**

**Secret Name**: `DATABASE_URL`
**Secret Value**:
```
postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require
```

---

### **Option B: Use Main Neon Database (Alternative)**

**Secret Name**: `NEON_DATABASE_URL`
**Secret Value**:
```
postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

### **Option C: Dedicated Test Database (Recommended for Production)**

**Secret Name**: `DATABASE_URL_TEST`
**Secret Value**: *Create a separate test database in Neon and use that URL*

---

## 🚀 Quick Setup Steps

1. **Copy one of the URLs above**
2. **Go to GitHub**: `https://github.com/Vamsi-027/tara-hub`
3. **Navigate**: Settings → Secrets and variables → Actions
4. **Click**: New repository secret
5. **Add**:
   - Name: `DATABASE_URL` (for quick setup)
   - Value: The URL from Option A above
6. **Save**: Click "Add secret"

## ✅ Test the Setup

After adding the secret:

1. **Make a small change**:
   ```bash
   echo "# CI Test" >> medusa/README.md
   git add medusa/README.md
   git commit -m "Test GitHub Actions with Neon database"
   git push origin main
   ```

2. **Watch the workflow**:
   - Go to GitHub Actions tab
   - See "Materials Module Tests" running
   - Should complete in ~5-10 minutes

## 🔧 Local Testing

Test the same setup locally:

```bash
# Use your production database for local E2E testing
export DATABASE_URL="postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require"

# Run E2E tests
cd medusa && npm run test:e2e:materials
```

## 🛡️ Security Notes

- ✅ Your database uses SSL (sslmode=require)
- ✅ Test data uses unique prefixes (safe for production DB)
- ✅ GitHub encrypts all secret values
- ✅ Secrets never appear in logs

## 🎯 What Gets Tested

Your E2E tests will validate:
- ✅ Materials API authentication
- ✅ List materials with pagination
- ✅ Search materials (q parameter)
- ✅ Get individual materials by ID
- ✅ Error handling (404 for missing materials)
- ✅ Database schema and migrations

All using your real Neon cloud database!