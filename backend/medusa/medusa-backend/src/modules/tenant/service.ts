import { MedusaService } from "@medusajs/framework/utils"
import Tenant from "./models/tenant"

class TenantModuleService extends MedusaService({
  Tenant,
}) {
  async resolveTenant(hostname: string) {
    // Remove port if present
    const domain = hostname.split(':')[0]
    
    // Check for subdomain first (e.g., customer.tara-hub.com)
    const parts = domain.split('.')
    if (parts.length > 2) {
      const subdomain = parts[0]
      const [tenant] = await this.listTenants({
        subdomain: subdomain
      })
      
      if (tenant) return tenant
    }
    
    // Check for custom domain (e.g., customerdomain.com)
    const [tenant] = await this.listTenants({
      domain: domain
    })
    
    return tenant || null
  }

  async getTenantById(id: string) {
    return await this.retrieveTenant(id)
  }

  async createTenant(data: any) {
    return await this.createTenants(data)
  }

  async getDefaultTenant() {
    // Check if default tenant exists
    try {
      const tenant = await this.retrieveTenant('tenant_default')
      if (tenant) return tenant
    } catch (e) {
      // Tenant doesn't exist, create it
    }
    
    // Create default tenant for fabric-store
    return await this.createTenant({
      id: 'tenant_default',
      name: 'Tara Hub Fabrics',
      domain: 'localhost:3006',
      subdomain: 'fabric-store',
      store_id: 'store_default',
      store_name: 'Tara Hub Fabric Store',
      store_currency: 'USD',
      email: 'admin@tara-hub.com',
      settings: {
        features: {
          enableWholesale: false,
          enableSamples: true,
          enableCustomization: false,
          maxSamplesPerOrder: 5
        },
        branding: {
          primaryColor: '#000000',
          logo: null,
          favicon: null
        },
        commerce: {
          minOrderAmount: 0,
          taxRate: 0.08,
          shippingZones: [
            {
              name: 'US Domestic',
              countries: ['US'],
              rate: 9.99
            }
          ]
        }
      },
      is_active: true,
      is_premium: false,
    })
  }
}

export default TenantModuleService