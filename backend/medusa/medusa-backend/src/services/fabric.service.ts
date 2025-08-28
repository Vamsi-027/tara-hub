import { MedusaService } from "@medusajs/framework/utils"
import { Fabric } from "../models/fabric"

type CreateFabricInput = {
  name: string
  sku: string
  description?: string
  category: string
  color: string
  color_family: string
  pattern: string
  usage: "Indoor" | "Outdoor" | "Both"
  properties: string[]
  swatch_image_url: string
  color_hex: string
  composition: string
  width: string
  weight: string
  durability: string
  care_instructions: string
  in_stock?: boolean
  collection?: string
  price?: number
  stock_quantity?: number
  metadata?: Record<string, any>
}

type UpdateFabricInput = Partial<CreateFabricInput>

type ListFabricsInput = {
  category?: string
  collection?: string
  color_family?: string
  pattern?: string
  usage?: string
  in_stock?: boolean
  limit?: number
  offset?: number
}

export class FabricService extends MedusaService {
  protected repository_: any

  constructor(container: any) {
    super(container)
    this.repository_ = container.fabricRepository
  }

  async create(input: CreateFabricInput): Promise<Fabric> {
    const fabric = this.repository_.create(input)
    return await this.repository_.save(fabric)
  }

  async retrieve(id: string): Promise<Fabric | null> {
    return await this.repository_.findOne({ where: { id } })
  }

  async retrieveBySku(sku: string): Promise<Fabric | null> {
    return await this.repository_.findOne({ where: { sku } })
  }

  async update(id: string, input: UpdateFabricInput): Promise<Fabric> {
    await this.repository_.update(id, input)
    return await this.retrieve(id)
  }

  async delete(id: string): Promise<void> {
    await this.repository_.delete(id)
  }

  async list(input: ListFabricsInput = {}): Promise<[Fabric[], number]> {
    const { limit = 50, offset = 0, ...filters } = input
    
    const query = this.repository_.createQueryBuilder("fabric")

    // Apply filters
    if (filters.category) {
      query.andWhere("fabric.category = :category", { category: filters.category })
    }
    if (filters.collection) {
      query.andWhere("fabric.collection = :collection", { collection: filters.collection })
    }
    if (filters.color_family) {
      query.andWhere("fabric.color_family = :color_family", { color_family: filters.color_family })
    }
    if (filters.pattern) {
      query.andWhere("fabric.pattern = :pattern", { pattern: filters.pattern })
    }
    if (filters.usage) {
      query.andWhere("fabric.usage = :usage", { usage: filters.usage })
    }
    if (filters.in_stock !== undefined) {
      query.andWhere("fabric.in_stock = :in_stock", { in_stock: filters.in_stock })
    }

    // Apply pagination
    query.skip(offset).take(limit)

    const [fabrics, count] = await query.getManyAndCount()
    return [fabrics, count]
  }

  async listCollections(): Promise<string[]> {
    const result = await this.repository_
      .createQueryBuilder("fabric")
      .select("DISTINCT fabric.collection")
      .where("fabric.collection IS NOT NULL")
      .getRawMany()
    
    return result.map((r: any) => r.collection).filter(Boolean)
  }

  async listCategories(): Promise<string[]> {
    const result = await this.repository_
      .createQueryBuilder("fabric")
      .select("DISTINCT fabric.category")
      .getRawMany()
    
    return result.map((r: any) => r.category)
  }

  async search(query: string): Promise<Fabric[]> {
    return await this.repository_
      .createQueryBuilder("fabric")
      .where("fabric.name ILIKE :query", { query: `%${query}%` })
      .orWhere("fabric.sku ILIKE :query", { query: `%${query}%` })
      .orWhere("fabric.description ILIKE :query", { query: `%${query}%` })
      .orWhere("fabric.category ILIKE :query", { query: `%${query}%` })
      .orWhere("fabric.color ILIKE :query", { query: `%${query}%` })
      .limit(20)
      .getMany()
  }

  async updateStock(sku: string, quantity: number): Promise<Fabric> {
    const fabric = await this.retrieveBySku(sku)
    if (!fabric) {
      throw new Error(`Fabric with SKU ${sku} not found`)
    }
    
    fabric.stock_quantity = quantity
    fabric.in_stock = quantity > 0
    
    return await this.repository_.save(fabric)
  }

  async bulkCreate(fabrics: CreateFabricInput[]): Promise<Fabric[]> {
    const entities = fabrics.map(input => this.repository_.create(input))
    return await this.repository_.save(entities)
  }
}