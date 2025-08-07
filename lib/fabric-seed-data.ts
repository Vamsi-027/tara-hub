export interface Fabric {
  id: string
  name: string
  description: string
  composition: string
  width: string
  weight: string
  care: string
  origin: string
  category: string
  color: string
  pattern: string
  texture: string
  durability: string
  lightFastness: string
  abrasionResistance: string
  flameRetardant: boolean
  antimicrobial: boolean
  stainResistant: boolean
  waterRepellent: boolean
  images: string[]
  swatchImageUrl: string
  isFeatured: boolean
  inStock: boolean
  leadTime: string
  minimumOrder: string
  applications: string[]
  tags: string[]
}

export const fabricSeedData: Fabric[] = [
  {
    id: "fab-001",
    name: "Royal Velvet Emerald",
    description: "Luxurious emerald green velvet with exceptional depth and richness. Perfect for high-end upholstery and drapery applications.",
    composition: "100% Cotton Velvet",
    width: "54 inches",
    weight: "18 oz/sq yd",
    care: "Dry clean only",
    origin: "Italy",
    category: "Velvet",
    color: "Emerald Green",
    pattern: "Solid",
    texture: "Plush Velvet",
    durability: "Heavy Duty",
    lightFastness: "Grade 6",
    abrasionResistance: "50,000 cycles",
    flameRetardant: true,
    antimicrobial: false,
    stainResistant: true,
    waterRepellent: false,
    images: [
      "/emerald-green-velvet.png",
      "/placeholder.jpg"
    ],
    swatchImageUrl: "/emerald-green-velvet.png",
    isFeatured: true,
    inStock: true,
    leadTime: "2-3 weeks",
    minimumOrder: "5 yards",
    applications: ["Upholstery", "Drapery", "Pillows", "Headboards"],
    tags: ["luxury", "velvet", "green", "solid", "italian"]
  },
  {
    id: "fab-002",
    name: "Natural Linen Weave",
    description: "Premium natural linen with a beautiful organic texture. Ideal for contemporary and traditional interiors.",
    composition: "100% European Linen",
    width: "60 inches",
    weight: "12 oz/sq yd",
    care: "Machine washable, tumble dry low",
    origin: "Belgium",
    category: "Linen",
    color: "Natural",
    pattern: "Plain Weave",
    texture: "Natural Linen",
    durability: "Medium",
    lightFastness: "Grade 5",
    abrasionResistance: "25,000 cycles",
    flameRetardant: false,
    antimicrobial: true,
    stainResistant: false,
    waterRepellent: false,
    images: [
      "/natural-linen-fabric.png",
      "/placeholder.jpg"
    ],
    swatchImageUrl: "/natural-linen-fabric.png",
    isFeatured: true,
    inStock: true,
    leadTime: "1-2 weeks",
    minimumOrder: "3 yards",
    applications: ["Drapery", "Bedding", "Table Linens", "Light Upholstery"],
    tags: ["natural", "linen", "belgian", "organic", "breathable"]
  },
  {
    id: "fab-003",
    name: "Midnight Silk Damask",
    description: "Exquisite midnight blue silk damask with intricate woven patterns. A statement fabric for luxury interiors.",
    composition: "100% Mulberry Silk",
    width: "50 inches",
    weight: "14 oz/sq yd",
    care: "Dry clean only",
    origin: "China",
    category: "Silk",
    color: "Midnight Blue",
    pattern: "Damask",
    texture: "Smooth Silk",
    durability: "Medium",
    lightFastness: "Grade 4",
    abrasionResistance: "15,000 cycles",
    flameRetardant: false,
    antimicrobial: false,
    stainResistant: false,
    waterRepellent: false,
    images: [
      "/placeholder.jpg",
      "/placeholder.jpg"
    ],
    swatchImageUrl: "/placeholder.jpg",
    isFeatured: true,
    inStock: false,
    leadTime: "4-6 weeks",
    minimumOrder: "10 yards",
    applications: ["Drapery", "Wall Covering", "Decorative Pillows"],
    tags: ["silk", "damask", "blue", "luxury", "formal"]
  },
  {
    id: "fab-004",
    name: "Charcoal Wool Bouclé",
    description: "Sophisticated charcoal wool bouclé with distinctive texture and warmth. Perfect for modern upholstery.",
    composition: "85% Wool, 15% Nylon",
    width: "58 inches",
    weight: "16 oz/sq yd",
    care: "Dry clean only",
    origin: "Scotland",
    category: "Wool",
    color: "Charcoal",
    pattern: "Bouclé",
    texture: "Textured Bouclé",
    durability: "Heavy Duty",
    lightFastness: "Grade 6",
    abrasionResistance: "40,000 cycles",
    flameRetardant: true,
    antimicrobial: true,
    stainResistant: true,
    waterRepellent: true,
    images: [
      "/placeholder.jpg",
      "/placeholder.jpg"
    ],
    swatchImageUrl: "/placeholder.jpg",
    isFeatured: false,
    inStock: true,
    leadTime: "3-4 weeks",
    minimumOrder: "5 yards",
    applications: ["Upholstery", "Accent Chairs", "Ottomans"],
    tags: ["wool", "boucle", "charcoal", "textured", "scottish"]
  }
]
