# Medusa Multi-Region Setup: Industry Best Practices

## Overview

This document outlines the complete implementation of multi-region support in Medusa following e-commerce industry best practices. The setup enables proper USD pricing for US customers while maintaining EUR pricing for European customers.

## Architecture

### 1. Region Configuration

Each region is configured with:
- **Currency**: Native currency (USD, EUR)
- **Tax Handling**: US (tax excluded), EU (VAT included)
- **Payment Providers**: Stripe, Manual
- **Fulfillment**: Standard, Express, Overnight
- **Shipping Thresholds**: Free shipping tiers

### 2. Dynamic Region Selection

The system implements intelligent region detection:

```javascript
Priority Order:
1. User preference (localStorage)
2. URL parameter (?region=usd)
3. Geolocation (timezone-based)
4. Default configuration
```

## Implementation Steps

### Step 1: Create US Region

Run the setup script to create a properly configured US region:

```bash
# Set your admin password
export MEDUSA_ADMIN_PASSWORD="your-admin-password"

# Run the setup script
node scripts/create-us-region.js
```

This script will:
- Create a US region with USD currency
- Configure tax settings (6.35% average)
- Set up shipping options
- Update product pricing
- Configure store currencies

### Step 2: Update Environment Variables

After region creation, update your `.env.local`:

```env
# Region Configuration
NEXT_PUBLIC_MEDUSA_REGION_ID_EUR=reg_01K4G3YNKXEQ8G9EK2PJHE71QN
NEXT_PUBLIC_MEDUSA_REGION_ID_USD=<new-region-id-from-script>
NEXT_PUBLIC_MEDUSA_DEFAULT_REGION=usd
NEXT_PUBLIC_MEDUSA_CURRENCY_CODE=usd
```

### Step 3: Configure Product Pricing

The script automatically sets pricing for your products:

| Product | Fabric Price | Swatch Price |
|---------|-------------|--------------|
| Sandwell Lipstick | $530.00 | $4.50 |
| Jefferson Linen Sunglow | $85.00 | $3.50 |

### Step 4: Test Region Switching

Test the API with different regions:

```bash
# Fetch with USD pricing
curl "http://localhost:3006/api/fabrics?region=usd"

# Fetch with EUR pricing
curl "http://localhost:3006/api/fabrics?region=eur"
```

## Best Practices Implemented

### 1. Tax Handling

**US Region:**
- Prices displayed without tax
- Tax calculated at checkout
- State-specific tax rates supported

**EU Region:**
- Prices displayed with VAT included
- VAT rates by country
- B2B tax exemption support

### 2. Shipping Configuration

**Standard Tiers:**
- Standard: $10 (5-7 days)
- Express: $25 (2-3 days)
- Overnight: $50 (1 day)
- Free: Orders over $500

### 3. Currency Formatting

Proper locale-based formatting:
```javascript
// US: $1,234.56
// EU: €1.234,56
formatPrice(amount, regionKey)
```

### 4. Region Detection

Automatic region selection based on:
- Browser timezone
- Accept-Language header
- IP geolocation (optional)
- User preference

### 5. Price Conversion

Approximate conversion between regions:
```javascript
// USD to EUR: 0.92 rate
// EUR to USD: 1.09 rate
convertPrice(amount, fromRegion, toRegion)
```

## API Integration

### Fabric Store API

The API automatically selects the appropriate region:

```typescript
// GET /api/fabrics
// Optional: ?region=usd or ?region=eur

// Response includes region-specific pricing
{
  "fabrics": [...],
  "meta": {
    "region": "usd",
    "currency": "USD",
    "tax_included": false
  }
}
```

### Individual Product API

```typescript
// GET /api/fabrics/[id]?region=usd

// Response with USD pricing
{
  "fabric": {
    "price": 530.00,  // USD
    "swatch_price": 4.50,
    "currency": "USD"
  }
}
```

## Frontend Integration

### Region Selector Component

```typescript
import { getUserRegion, saveUserRegion } from '@/lib/medusa-config'

function RegionSelector() {
  const currentRegion = getUserRegion()

  const handleRegionChange = (region: string) => {
    saveUserRegion(region)
    window.location.reload() // Refresh to update prices
  }

  return (
    <select onChange={(e) => handleRegionChange(e.target.value)}>
      <option value="usd">🇺🇸 USD</option>
      <option value="eur">🇪🇺 EUR</option>
    </select>
  )
}
```

### Price Display

```typescript
import { formatPrice, getTaxMessage } from '@/lib/medusa-config'

function ProductPrice({ amount }: { amount: number }) {
  return (
    <div>
      <span className="price">{formatPrice(amount)}</span>
      <span className="tax-note">{getTaxMessage()}</span>
    </div>
  )
}
```

## Testing Checklist

- [ ] US region created successfully
- [ ] Product prices display in USD
- [ ] Tax excluded from US prices
- [ ] Shipping options available
- [ ] Region switching works
- [ ] Checkout flow completes
- [ ] Stripe accepts USD payments

## Troubleshooting

### Issue: Prices showing as null

**Solution:** Ensure region ID is set in environment variables and products have prices for that region.

### Issue: Region not switching

**Solution:** Clear localStorage and check region parameter in API calls.

### Issue: Tax calculation incorrect

**Solution:** Verify region tax_rate and tax_included settings in Medusa admin.

## Production Deployment

1. **Environment Variables**: Set all region IDs in production `.env`
2. **CDN Configuration**: Cache API responses per region
3. **Analytics**: Track region-specific conversion rates
4. **SEO**: Implement hreflang tags for regional URLs
5. **Legal**: Ensure compliance with regional tax laws

## Monitoring

Key metrics to track:
- Region selection distribution
- Conversion rates by region
- Average order value by currency
- Shipping method preferences
- Tax calculation accuracy

## Future Enhancements

1. **Additional Regions**
   - Canada (CAD)
   - Australia (AUD)
   - Japan (JPY)

2. **Advanced Features**
   - Real-time exchange rates
   - IP-based geolocation
   - Multi-currency checkout
   - Regional promotions

3. **Optimization**
   - Edge caching by region
   - Regional CDN nodes
   - Localized content delivery

## Support

For issues or questions:
1. Check Medusa documentation: https://docs.medusajs.com
2. Review error logs in Medusa admin
3. Test with the provided scripts
4. Contact support with region ID and error details