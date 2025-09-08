import { MedusaService } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Client } from "pg"
import FabricProductConfig, { 
  FabricProductType,
  OrderFabricSelection,
  FabricProductAvailability 
} from "./models/fabric-product-config"

export type CreateFabricProductDTO = {
  product_id: string
  fabric_type: FabricProductType
  allow_fabric_selection?: boolean
  fabric_category_filter?: string
  fabric_collection_filter?: string
  max_fabric_selections?: number
  min_fabric_selections?: number
  base_price_override?: number
  price_per_selection?: number
}

export type FabricSelectionDTO = {
  fabric_id: string
  fabric_sku: string
  fabric_name: string
  selection_index?: number
}

/**
 * Service for managing fabric-based products
 * Handles all 4 product types and their interactions with fabrics
 */
class FabricProductModuleService extends MedusaService({
  FabricProductConfig,
  OrderFabricSelection,
  FabricProductAvailability
}) {
  protected container_: MedusaContainer
  protected adminDb_: Client | null = null

  constructor(container: MedusaContainer) {
    super(container)
    this.container_ = container
  }

  /**
   * Get admin database connection for fabric queries
   */
  private async getAdminDb(): Promise<Client> {
    if (!this.adminDb_) {
      this.adminDb_ = new Client({
        connectionString: process.env.ADMIN_DATABASE_URL || 
                         process.env.DATABASE_URL ||
                         process.env.POSTGRES_URL,
        ssl: process.env.NODE_ENV === "production" ? {
          rejectUnauthorized: false
        } : undefined
      })
      await this.adminDb_.connect()
    }
    return this.adminDb_
  }

  /**
   * Configure a product for fabric selection
   */
  async configureFabricProduct(data: CreateFabricProductDTO) {
    const config = await this.createFabricProductConfig(data)
    return config
  }

  /**
   * Type 1: Create configurable fabric product
   * User selects fabric during purchase
   */
  async createConfigurableFabricProduct(productId: string, options: {
    category_filter?: string
    collection_filter?: string
    base_price?: number
  } = {}) {
    return this.configureFabricProduct({
      product_id: productId,
      fabric_type: FabricProductType.CONFIGURABLE_FABRIC,
      allow_fabric_selection: true,
      fabric_category_filter: options.category_filter,
      fabric_collection_filter: options.collection_filter,
      base_price_override: options.base_price,
      max_fabric_selections: 1,
      min_fabric_selections: 1
    })
  }


  /**
   * Type 3: Create configurable swatch set product
   * User selects multiple fabrics (e.g., 4 swatches for $10)
   */
  async createConfigurableSwatchSetProduct(productId: string, options: {
    max_selections: number
    min_selections: number
    set_price: number
    category_filter?: string
  }) {
    return this.configureFabricProduct({
      product_id: productId,
      fabric_type: FabricProductType.CONFIGURABLE_SWATCH_SET,
      allow_fabric_selection: true,
      max_fabric_selections: options.max_selections,
      min_fabric_selections: options.min_selections,
      base_price_override: options.set_price,
      fabric_category_filter: options.category_filter
    })
  }


  /**
   * Get available fabrics for a configurable product
   */
  async getAvailableFabrics(productId: string, options: {
    category?: string
    collection?: string
    search?: string
    limit?: number
    offset?: number
  } = {}) {
    const config = await this.getFabricProductConfig(productId)
    
    if (!config || !config.allow_fabric_selection) {
      throw new Error("Product does not allow fabric selection")
    }

    const db = await this.getAdminDb()
    
    // Build query with filters
    let query = `
      SELECT 
        id, sku, name, description, 
        retail_price, wholesale_price,
        color_family, pattern, collection,
        width, weight, fiber_content,
        thumbnail_url, swatch_image_url,
        available_quantity, minimum_order
      FROM fabrics 
      WHERE deleted_at IS NULL 
      AND status = 'active'
      AND available_quantity > 0
    `
    
    const params: any[] = []
    let paramIndex = 1

    // Apply category filter
    if (config.fabric_category_filter || options.category) {
      query += ` AND category = $${paramIndex}`
      params.push(config.fabric_category_filter || options.category)
      paramIndex++
    }

    // Apply collection filter
    if (config.fabric_collection_filter || options.collection) {
      query += ` AND collection = $${paramIndex}`
      params.push(config.fabric_collection_filter || options.collection)
      paramIndex++
    }

    // Apply search
    if (options.search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      params.push(`%${options.search}%`)
      paramIndex++
    }

    // Add ordering and pagination
    query += ` ORDER BY name ASC`
    
    if (options.limit) {
      query += ` LIMIT $${paramIndex}`
      params.push(options.limit)
      paramIndex++
    }
    
    if (options.offset) {
      query += ` OFFSET $${paramIndex}`
      params.push(options.offset)
    }

    const result = await db.query(query, params)
    
    // Check for product-specific availability/pricing
    const availability = await this.getFabricAvailability(productId, result.rows.map(f => f.id))
    
    // Merge availability data
    return result.rows.map(fabric => {
      const avail = availability.find(a => a.fabric_id === fabric.id)
      return {
        ...fabric,
        is_available: avail?.is_available ?? true,
        price_adjustment: avail?.price_adjustment ?? 0,
        lead_time_days: avail?.lead_time_days,
        effective_price: fabric.retail_price + (avail?.price_adjustment ?? 0)
      }
    })
  }

  /**
   * Save fabric selection for a cart line item
   */
  async saveFabricSelection(
    lineItemId: string,
    orderId: string,
    productId: string,
    selections: FabricSelectionDTO[]
  ) {
    const config = await this.getFabricProductConfig(productId)
    
    if (!config) {
      throw new Error("Product is not configured for fabric selection")
    }

    // Validate selection count
    if (config.fabric_type === FabricProductType.CONFIGURABLE_SWATCH_SET) {
      if (selections.length < config.min_fabric_selections) {
        throw new Error(`Minimum ${config.min_fabric_selections} fabrics required`)
      }
      if (selections.length > config.max_fabric_selections) {
        throw new Error(`Maximum ${config.max_fabric_selections} fabrics allowed`)
      }
    }

    // Get fabric details from admin DB
    const db = await this.getAdminDb()
    
    // Save each selection
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i]
      
      // Get fabric snapshot
      const fabricResult = await db.query(
        `SELECT * FROM fabrics WHERE id = $1`,
        [selection.fabric_id]
      )
      
      if (fabricResult.rows.length === 0) {
        throw new Error(`Fabric ${selection.fabric_id} not found`)
      }
      
      const fabric = fabricResult.rows[0]
      
      // Create selection record
      await this.createOrderFabricSelection({
        order_id: orderId,
        line_item_id: lineItemId,
        product_id: productId,
        fabric_id: selection.fabric_id,
        fabric_sku: fabric.sku,
        fabric_name: fabric.name,
        fabric_price: fabric.retail_price,
        fabric_metadata: {
          color_family: fabric.color_family,
          pattern: fabric.pattern,
          collection: fabric.collection,
          fiber_content: fabric.fiber_content,
          width: fabric.width,
          weight: fabric.weight,
          thumbnail_url: fabric.thumbnail_url,
          swatch_image_url: fabric.swatch_image_url
        },
        selection_index: selection.selection_index || (i + 1)
      })
    }
  }

  /**
   * Calculate price for fabric selection
   */
  async calculateFabricPrice(productId: string, fabricSelections: string[]): Promise<number> {
    const config = await this.getFabricProductConfig(productId)
    
    if (!config) {
      throw new Error("Product configuration not found")
    }

    // Fixed price products
    if (config.base_price_override) {
      return config.base_price_override
    }

    // Configurable swatch set with fixed price
    if (config.fabric_type === FabricProductType.CONFIGURABLE_SWATCH_SET && config.base_price_override) {
      return config.base_price_override
    }

    // Calculate based on selected fabrics
    const db = await this.getAdminDb()
    let totalPrice = 0

    for (const fabricId of fabricSelections) {
      const result = await db.query(
        `SELECT retail_price FROM fabrics WHERE id = $1`,
        [fabricId]
      )
      
      if (result.rows.length > 0) {
        const fabric = result.rows[0]
        
        // Check for product-specific pricing
        const availability = await this.getFabricAvailability(productId, [fabricId])
        const adjustment = availability[0]?.price_adjustment ?? 0
        
        totalPrice += fabric.retail_price + adjustment
      }
    }

    // Apply per-selection pricing if configured
    if (config.price_per_selection) {
      totalPrice = config.price_per_selection * fabricSelections.length
    }

    return totalPrice
  }

  /**
   * Get fabric selections for an order
   */
  async getOrderFabricSelections(orderId: string) {
    return this.listOrderFabricSelections({
      where: { order_id: orderId }
    })
  }

  /**
   * Set fabric availability for a product
   */
  async setFabricAvailability(
    productId: string,
    fabricId: string,
    options: {
      is_available?: boolean
      price_adjustment?: number
      lead_time_days?: number
      min_order_quantity?: number
    }
  ) {
    const existing = await this.listFabricProductAvailability({
      where: { product_id: productId, fabric_id: fabricId }
    })

    if (existing.length > 0) {
      return this.updateFabricProductAvailability(existing[0].id, options)
    } else {
      return this.createFabricProductAvailability({
        product_id: productId,
        fabric_id: fabricId,
        ...options
      })
    }
  }

  /**
   * Helper: Get fabric product configuration
   */
  private async getFabricProductConfig(productId: string) {
    const configs = await this.listFabricProductConfigs({
      where: { product_id: productId }
    })
    return configs[0] || null
  }

  /**
   * Helper: Get fabric availability for products
   */
  private async getFabricAvailability(productId: string, fabricIds: string[]) {
    return this.listFabricProductAvailability({
      where: { 
        product_id: productId,
        fabric_id: { $in: fabricIds }
      }
    })
  }

  /**
   * Cleanup on disconnect
   */
  async onModuleDestroy() {
    if (this.adminDb_) {
      await this.adminDb_.end()
    }
  }
}

export default FabricProductModuleService