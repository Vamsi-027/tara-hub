# 🌐 CORS-Enabled API Guide

Your fabric store APIs now have full CORS support! Here's how to use them from any domain or application.

## ✅ **CORS Setup Complete**

**Features Enabled:**
- ✅ Cross-origin requests from any domain
- ✅ Preflight OPTIONS request handling  
- ✅ Custom headers support
- ✅ Multiple HTTP methods (GET, POST, PUT, DELETE)
- ✅ Development and production configurations

## 🔧 **Configuration Files**

### **1. CORS Utility (`lib/cors.ts`)**
- Centralized CORS configuration
- Origin whitelist management
- Wrapper functions for easy integration

### **2. Middleware (`middleware.ts`)**
- Global CORS handling for all API routes
- Automatic preflight response
- Origin-based access control

### **3. Updated API Routes**
- `/api/fabrics/route.ts` - CORS-enabled fabric data
- `/api/orders/route.ts` - CORS-enabled order management
- All routes support OPTIONS preflight

## 🚀 **Testing Your CORS APIs**

### **Quick Test Page**
Visit: `http://localhost:3006/cors-test`
- Tests all API endpoints
- Shows CORS headers in action
- External origin testing

### **Manual Testing**
```bash
# Test preflight request
curl -X OPTIONS "http://localhost:3006/api/fabrics" \
  -H "Origin: http://localhost:3000" -v

# Test API with CORS
curl "http://localhost:3006/api/fabrics?limit=2" \
  -H "Origin: http://localhost:3000" -v
```

## 📡 **Using APIs from External Applications**

### **JavaScript/TypeScript**
```javascript
// From any domain or application
const response = await fetch('http://localhost:3006/api/fabrics', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://your-domain.com'
  }
})

const data = await response.json()
console.log('Fabrics:', data.fabrics)
```

### **React Application**
```jsx
import { useEffect, useState } from 'react'

function FabricsList() {
  const [fabrics, setFabrics] = useState([])
  
  useEffect(() => {
    fetch('http://localhost:3006/api/fabrics')
      .then(res => res.json())
      .then(data => setFabrics(data.fabrics))
      .catch(console.error)
  }, [])
  
  return (
    <div>
      {fabrics.map(fabric => (
        <div key={fabric.id}>{fabric.name}</div>
      ))}
    </div>
  )
}
```

### **Vue.js Application**
```vue
<template>
  <div>
    <div v-for="fabric in fabrics" :key="fabric.id">
      {{ fabric.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return { fabrics: [] }
  },
  async mounted() {
    const response = await fetch('http://localhost:3006/api/fabrics')
    const data = await response.json()
    this.fabrics = data.fabrics
  }
}
</script>
```

## 🎯 **Available Endpoints**

### **Fabrics API** (Multi-Source)
```
GET /api/fabrics
GET /api/fabrics?limit=10&offset=0
GET /api/fabrics?category=upholstery
GET /api/fabrics/[id]
```
**Data Sources**: Fabric API (port 3010) → Medusa (port 9000) → Sanity CMS → Fallback

### **Sanity CMS APIs** ✨ **NEW**
```
GET /api/hero-slides
GET /api/hero-slides?limit=3&active=true
```
**Data Sources**: Sanity CMS (Project: d1t5dcup) → Fallback

### **Orders API**
```
GET /api/orders
GET /api/orders?email=user@email.com
POST /api/orders
PUT /api/orders
```

### **Other APIs**
```
GET /api/customers
POST /api/create-payment-intent
POST /api/send-order-confirmation
```

## 🔒 **Security Configuration**

### **Allowed Origins**
Currently configured to allow:
- `http://localhost:3000` (main app)
- `http://localhost:3006` (fabric store)
- `http://localhost:3007` (store guide)
- `http://localhost:9000` (Medusa backend)
- `https://tara-hub.vercel.app` (production)

### **Allowed Methods**
- GET, POST, PUT, DELETE, OPTIONS

### **Allowed Headers**
- Content-Type, Authorization, X-Requested-With, Accept, Origin

## 🛠️ **Customization**

### **Add New Allowed Origin**
Edit `lib/cors.ts`:
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://your-new-domain.com', // Add here
  // ... existing origins
]
```

### **Restrict Access**
Change in `lib/cors.ts`:
```typescript
// Allow all origins (current)
'Access-Control-Allow-Origin': '*'

// Or restrict to specific origins
'Access-Control-Allow-Origin': 'https://trusted-domain.com'
```

## 🐛 **Troubleshooting**

### **CORS Error: "Access to fetch blocked"**
- Check origin is in `ALLOWED_ORIGINS` list
- Verify API server is running on port 3006
- Check browser console for specific error

### **Preflight Request Failed**
- Ensure OPTIONS method is enabled
- Check `middleware.ts` is properly configured
- Verify custom headers are in allowed list

### **API Returns 404**
- Check API endpoint exists
- Verify route file structure matches URL
- Check for typos in endpoint paths

## 🎨 **Sanity CMS Integration** ✨ **NEW**

Your CORS APIs now include **Sanity CMS integration**!

### **What's Connected:**
- ✅ **Hero Carousel API**: `/api/hero-slides` - Fetches from Sanity CMS
- ✅ **Fabric Data API**: `/api/fabrics` - Includes Sanity as data source #3
- ✅ **Project ID**: `d1t5dcup` configured and working
- ✅ **Fallback System**: Graceful degradation when Sanity unavailable

### **Sanity Schemas Available:**
- `heroSlide` - Hero carousel content management
- `fabric` - Fabric product data (newly created)

### **How to Use Sanity Content:**
1. **Deploy Schema**: `cd sanity-studio && sanity deploy`  
2. **Start Studio**: `npm run dev` (port 3333)
3. **Create Content**: Add hero slides and fabric products
4. **API Access**: Content automatically available via CORS APIs

### **Example Sanity API Usage:**
```javascript
// Get hero slides from Sanity CMS
const slides = await fetch('http://localhost:3006/api/hero-slides')
  .then(res => res.json())

console.log(slides.source) // "sanity" or "fallback"
console.log(slides.slides) // Array of hero slides
```

## ✨ **Success! Your APIs Are Now CORS + Sanity Enabled**

Your fabric store APIs can now be accessed from:
- ✅ Any web application  
- ✅ Mobile apps
- ✅ Desktop applications  
- ✅ Third-party integrations
- ✅ Microservices architecture
- ✅ **Sanity CMS content management** ✨

**Data Sources Hierarchy:**
1. **Primary APIs** (Fabric API server, Medusa)
2. **Sanity CMS** (Content management)  
3. **Fallback Data** (Always available)

Test it out at: `http://localhost:3006/cors-test`