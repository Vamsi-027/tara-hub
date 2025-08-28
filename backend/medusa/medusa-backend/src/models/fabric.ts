import { BaseEntity } from "@medusajs/framework/utils"
import { Column, Entity, Index } from "typeorm"

@Entity()
export class Fabric extends BaseEntity {
  @Column()
  name: string

  @Column({ unique: true })
  sku: string

  @Column({ type: "text", nullable: true })
  description: string

  @Column()
  category: string

  @Column()
  color: string

  @Column()
  color_family: string

  @Column()
  pattern: string

  @Column({ type: "enum", enum: ["Indoor", "Outdoor", "Both"], default: "Indoor" })
  usage: "Indoor" | "Outdoor" | "Both"

  @Column("simple-array")
  properties: string[]

  @Column()
  swatch_image_url: string

  @Column()
  color_hex: string

  @Column()
  composition: string

  @Column()
  width: string

  @Column()
  weight: string

  @Column()
  durability: string

  @Column({ type: "text" })
  care_instructions: string

  @Column({ default: true })
  in_stock: boolean

  @Column({ nullable: true })
  collection: string

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number

  @Column({ type: "int", default: 0 })
  stock_quantity: number

  @Index()
  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>
}