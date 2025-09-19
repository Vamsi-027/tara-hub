# R2 CORS Configuration

## Steps to Fix CORS for Images

1. **Log into Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to R2 > Your Bucket (tara-fabric-images)

2. **Configure CORS Settings**
   - Go to Settings tab
   - Find CORS Policy section
   - Add the following CORS rules:

```json
[
  {
    "AllowedOrigins": [
      "https://fabric-store-ten.vercel.app",
      "https://fabric-store-*.vercel.app",
      "http://localhost:3000",
      "http://localhost:3006",
      "http://localhost:9000",
      "https://tara-hub.vercel.app",
      "https://medusa-backend-production-3655.up.railway.app"
    ],
    "AllowedMethods": ["GET", "HEAD", "POST", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

3. **Alternative: Using Wrangler CLI**
   ```bash
   # Install wrangler if not already installed
   npm install -g wrangler

   # Apply CORS configuration
   wrangler r2 bucket cors put tara-fabric-images --rules ./scripts/r2-cors-config.json
   ```

4. **Verify CORS Headers**
   ```bash
   curl -I -H "Origin: https://fabric-store-ten.vercel.app" \
     https://pub-0f1e091e4a364b6480d18e1a8f3ca78f.r2.dev/path/to/image.jpg
   ```

   Should return headers like:
   - `Access-Control-Allow-Origin: https://fabric-store-ten.vercel.app`
   - `Access-Control-Allow-Methods: GET, HEAD, POST, PUT, DELETE`

## Public Access Settings

Also ensure your R2 bucket has public access enabled:
1. In R2 Settings > Public Access
2. Enable "Allow public access"
3. Note the public URL (should be like: https://pub-*.r2.dev)

## Testing

After configuration, test in fabric-store:
1. Visit https://fabric-store-ten.vercel.app/browse
2. Check browser console for CORS errors
3. Images should load without CORS blocking