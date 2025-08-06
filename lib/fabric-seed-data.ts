export interface Fabric {
  id: string
  name: string
  sku: string
  description?: string
  type: "Upholstery" | "Drapery" | "Both"
  pattern: string
  color: string
  colorHex?: string
  manufacturer: string
  collection?: string
  pricePerYard: number
  width: number
  minimumOrder: number
  leadTime: number
  stockQuantity: number
  isCustomOrder: boolean
  content?: string
  weight?: number
  durability: string
  martindale: number
  isStainResistant: boolean
  isFadeResistant: boolean
  isWaterResistant: boolean
  isPetFriendly: boolean
  isOutdoorSafe: boolean
  isFireRetardant: boolean
  careInstructions?: string[]
  notes?: string
  images?: {
    thumbnail?: string
    main?: string
    detail?: string[]
    room?: string[]
  }
  swatchImageUrl?: string
  tags?: string[]
  isActive: boolean
  isFeatured: boolean
  warrantyInfo?: string
  createdAt: string
  updatedAt: string
}

export const fabricSeedData: Fabric[] = [
  {
    id: "fab-001",
    name: "Luxe Velvet Emerald",
    sku: "LVE-001",
    description: "Premium emerald green velvet upholstery fabric with rich texture",
    type: "Upholstery",
    pattern: "Solid",
    color: "Emerald Green",
    colorHex: "#50C878",
    manufacturer: "Premium Textiles Co.",
    collection: "Luxe Collection",
    pricePerYard: 89.99,
    width: 54,
    minimumOrder: 1,
    leadTime: 14,
    stockQuantity: 125,
    isCustomOrder: false,
    content: "100% Cotton Velvet",
    weight: 16,
    durability: "Heavy Duty",
    martindale: 50000,
    isStainResistant: true,
    isFadeResistant: true,
    isWaterResistant: false,
    isPetFriendly: true,
    isOutdoorSafe: false,
    isFireRetardant: true,
    careInstructions: ["Professional cleaning recommended", "Avoid direct sunlight"],
    notes: "Perfect for accent chairs and luxury furniture",
    swatchImageUrl: "/emerald-green-velvet.png",
    tags: ["luxury", "velvet", "green", "upholstery"],
    isActive: true,
    isFeatured: true,
    warrantyInfo: "2 year warranty against manufacturing defects",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "fab-002",
    name: "Natural Linen Blend",
    sku: "NLB-002",
    description: "Breathable natural linen blend perfect for drapery and light upholstery",
    type: "Both",
    pattern: "Textured",
    color: "Natural Beige",
    colorHex: "#F5F5DC",
    manufacturer: "Eco Fabrics Ltd.",
    collection: "Natural Elements",
    pricePerYard: 45.50,
    width: 54,
    minimumOrder: 2,
    leadTime: 7,
    stockQuantity: 200,
    isCustomOrder: false,
    content: "60% Linen, 40% Cotton",
    weight: 8,
    durability: "Medium",
    martindale: 25000,
    isStainResistant: false,
    isFadeResistant: true,
    isWaterResistant: false,
    isPetFriendly: false,
    isOutdoorSafe: false,
    isFireRetardant: false,
    careInstructions: ["Machine washable cold", "Tumble dry low", "Iron medium heat"],
    notes: "Sustainable and eco-friendly option",
    swatchImageUrl: "/natural-linen-fabric.png",
    tags: ["natural", "linen", "eco-friendly", "versatile"],
    isActive: true,
    isFeatured: false,
    warrantyInfo: "1 year warranty",
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-01-10T14:30:00Z"
  },
  {
    id: "fab-003",
    name: "Outdoor Performance Navy",
    sku: "OPN-003",
    description: "Weather-resistant navy blue fabric ideal for outdoor furniture",
    type: "Upholstery",
    pattern: "Solid",
    color: "Navy Blue",
    colorHex: "#000080",
    manufacturer: "Weather Guard Textiles",
    collection: "Outdoor Pro",
    pricePerYard: 65.75,
    width: 54,
    minimumOrder: 1,
    leadTime: 10,
    stockQuantity: 75,
    isCustomOrder: false,
    content: "100% Solution-Dyed Acrylic",
    weight: 12,
    durability: "Heavy Duty",
    martindale: 75000,
    isStainResistant: true,
    isFadeResistant: true,
    isWaterResistant: true,
    isPetFriendly: true,
    isOutdoorSafe: true,
    isFireRetardant: false,
    careInstructions: ["Hose clean", "Air dry", "Mild soap if needed"],
    notes: "UV resistant and mildew resistant",
    swatchImageUrl: "/placeholder.svg?width=64&height=64&text=Navy",
    tags: ["outdoor", "weather-resistant", "navy", "performance"],
    isActive: true,
    isFeatured: true,
    warrantyInfo: "5 year fade warranty",
    createdAt: "2024-01-05T09:15:00Z",
    updatedAt: "2024-01-05T09:15:00Z"
  }
]
