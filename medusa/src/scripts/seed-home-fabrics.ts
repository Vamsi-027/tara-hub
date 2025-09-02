/**
 * Seed script for Home Fabric Products
 * Run with: npx medusa exec ./src/scripts/seed-home-fabrics.ts
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const homeFabricProducts = [
  // UPHOLSTERY FABRICS
  {
    title: "Emerald Velvet Upholstery",
    handle: "emerald-velvet-upholstery",
    description: "Luxurious deep-pile velvet perfect for statement sofas and elegant chairs. This premium fabric features a rich emerald green color with exceptional durability and stain resistance.",
    subtitle: "Premium Velvet for Furniture",
    material: "100% Polyester Velvet",
    metadata: {
      category: "Upholstery",
      fabric_type: "Velvet",
      weight: "450 GSM",
      width: "54 inches",
      composition: "100% Polyester",
      care_instructions: "Professional cleaning recommended",
      features: ["Stain Resistant", "Pet Friendly", "Fire Retardant", "Heavy Duty"],
      color: "Emerald Green",
      color_hex: "#065f46",
      pattern: "Solid",
      texture: "Plush",
      usage: "Sofas, Chairs, Ottomans",
      durability_rating: 5,
      abrasion_resistance: "50,000 double rubs",
      light_fastness: "Grade 5",
      is_featured: true,
      is_eco: false,
      stock_unit: "yard",
      min_order: 1,
      lead_time: "2-3 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "VEL-EMR-001",
        manage_inventory: true,
        inventory_quantity: 150,
        prices: [
          { amount: 8999, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "VEL-EMR-001-SWATCH",
        manage_inventory: true,
        inventory_quantity: 500,
        prices: [
          { amount: 500, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1631049035326-57414e1739d7?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1631049035326-57414e1739d7?w=600"
  },
  
  // CURTAIN FABRICS
  {
    title: "Natural Linen Curtain Fabric",
    handle: "natural-linen-curtain",
    description: "Breathable, light-filtering linen ideal for modern window treatments. Creates a soft, diffused light while maintaining privacy.",
    subtitle: "100% Pure Linen for Curtains",
    material: "100% Linen",
    metadata: {
      category: "Curtains & Drapes",
      fabric_type: "Linen",
      weight: "280 GSM",
      width: "110 inches",
      composition: "100% Natural Linen",
      care_instructions: "Machine washable, gentle cycle",
      features: ["Natural Fiber", "Easy Care", "Light Filtering", "Wrinkle Resistant"],
      color: "Natural Beige",
      color_hex: "#f5f5f4",
      pattern: "Solid",
      texture: "Textured Weave",
      usage: "Curtains, Drapes, Room Dividers",
      light_filtering: "Medium",
      thermal_insulation: "Good",
      is_featured: true,
      is_eco: true,
      stock_unit: "yard",
      min_order: 2,
      lead_time: "1-2 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "LIN-NAT-002",
        manage_inventory: true,
        inventory_quantity: 200,
        prices: [
          { amount: 5499, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "LIN-NAT-002-SWATCH",
        manage_inventory: true,
        inventory_quantity: 300,
        prices: [
          { amount: 500, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600"
  },
  
  // CUSHION FABRICS
  {
    title: "Modern Geometric Print Cotton",
    handle: "geometric-print-cushion",
    description: "Bold contemporary patterns for accent cushions and throw pillows. Machine washable and colorfast.",
    subtitle: "Designer Cotton Blend for Cushions",
    material: "Cotton/Polyester Blend",
    metadata: {
      category: "Cushion Covers",
      fabric_type: "Cotton Blend",
      weight: "320 GSM",
      width: "54 inches",
      composition: "65% Cotton, 35% Polyester",
      care_instructions: "Machine washable at 40°C",
      features: ["Machine Washable", "Colorfast", "Soft Touch", "Wrinkle Resistant"],
      color: "Multi-color Geometric",
      color_hex: "#f97316",
      pattern: "Geometric",
      texture: "Smooth",
      usage: "Cushions, Pillows, Light Upholstery",
      is_featured: false,
      is_eco: false,
      stock_unit: "yard",
      min_order: 1,
      lead_time: "2-3 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "GEO-CUS-003",
        manage_inventory: true,
        inventory_quantity: 180,
        prices: [
          { amount: 3999, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "GEO-CUS-003-SWATCH",
        manage_inventory: true,
        inventory_quantity: 250,
        prices: [
          { amount: 500, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=600"
  },
  
  // OUTDOOR FABRICS
  {
    title: "Waterproof Striped Canvas",
    handle: "waterproof-outdoor-canvas",
    description: "Durable outdoor fabric perfect for patio furniture and garden cushions. UV protected and mold resistant.",
    subtitle: "All-Weather Outdoor Canvas",
    material: "Solution Dyed Acrylic",
    metadata: {
      category: "Outdoor Fabrics",
      fabric_type: "Canvas",
      weight: "380 GSM",
      width: "60 inches",
      composition: "100% Solution Dyed Acrylic",
      care_instructions: "Hose clean, air dry",
      features: ["UV Protected", "Mold Resistant", "Waterproof", "Fade Resistant"],
      color: "Navy Blue Stripe",
      color_hex: "#1e3a8a",
      pattern: "Striped",
      texture: "Canvas Weave",
      usage: "Outdoor Furniture, Awnings, Marine",
      water_resistance: "Excellent",
      uv_resistance: "1500+ hours",
      is_featured: true,
      is_eco: false,
      stock_unit: "yard",
      min_order: 2,
      lead_time: "3-4 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "OUT-CAN-004",
        manage_inventory: true,
        inventory_quantity: 120,
        prices: [
          { amount: 6499, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "OUT-CAN-004-SWATCH",
        manage_inventory: true,
        inventory_quantity: 200,
        prices: [
          { amount: 500, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600"
  },
  
  // DESIGNER PATTERNS
  {
    title: "Luxury Damask Silk Blend",
    handle: "luxury-damask-silk",
    description: "Exquisite damask pattern woven in silk blend, perfect for formal dining chairs and decorative pillows.",
    subtitle: "Premium Silk Damask",
    material: "Silk/Polyester Blend",
    metadata: {
      category: "Designer Patterns",
      fabric_type: "Damask",
      weight: "340 GSM",
      width: "54 inches",
      composition: "45% Silk, 55% Polyester",
      care_instructions: "Dry clean only",
      features: ["Luxury Finish", "Intricate Pattern", "Durable", "Elegant"],
      color: "Ivory Gold",
      color_hex: "#ffd700",
      pattern: "Damask",
      texture: "Jacquard Weave",
      usage: "Formal Furniture, Decorative Accents",
      is_featured: true,
      is_eco: false,
      is_new: true,
      stock_unit: "yard",
      min_order: 1,
      lead_time: "4-5 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "DAM-SIL-005",
        manage_inventory: true,
        inventory_quantity: 80,
        prices: [
          { amount: 12999, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "DAM-SIL-005-SWATCH",
        manage_inventory: true,
        inventory_quantity: 150,
        prices: [
          { amount: 800, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=600"
  },
  
  // ECO-FRIENDLY FABRICS
  {
    title: "Organic Hemp Canvas",
    handle: "organic-hemp-canvas",
    description: "Sustainable, durable hemp fabric perfect for eco-conscious upholstery projects. Naturally antimicrobial and hypoallergenic.",
    subtitle: "100% Organic Hemp",
    material: "100% Hemp",
    metadata: {
      category: "Eco-Friendly Fabrics",
      fabric_type: "Hemp Canvas",
      weight: "420 GSM",
      width: "58 inches",
      composition: "100% Organic Hemp",
      care_instructions: "Machine washable, line dry",
      features: ["Sustainable", "Antimicrobial", "Hypoallergenic", "Biodegradable"],
      color: "Natural Hemp",
      color_hex: "#c4b5a0",
      pattern: "Solid",
      texture: "Canvas",
      usage: "Upholstery, Curtains, Bags",
      certifications: ["GOTS Certified", "OEKO-TEX 100"],
      sustainability_score: 95,
      recycled_content: 0,
      is_featured: true,
      is_eco: true,
      is_new: true,
      stock_unit: "yard",
      min_order: 2,
      lead_time: "3-4 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "HEM-ECO-006",
        manage_inventory: true,
        inventory_quantity: 100,
        prices: [
          { amount: 7999, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "HEM-ECO-006-SWATCH",
        manage_inventory: true,
        inventory_quantity: 200,
        prices: [
          { amount: 600, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600"
  },
  
  // LUXURY UPHOLSTERY
  {
    title: "Premium Leather-Look Vinyl",
    handle: "premium-leather-vinyl",
    description: "High-quality vinyl upholstery that looks and feels like genuine leather. Perfect for high-traffic furniture.",
    subtitle: "Faux Leather Upholstery",
    material: "PVC Vinyl",
    metadata: {
      category: "Upholstery",
      fabric_type: "Vinyl",
      weight: "550 GSM",
      width: "54 inches",
      composition: "100% PVC with Fabric Backing",
      care_instructions: "Wipe clean with damp cloth",
      features: ["Waterproof", "Easy Clean", "Durable", "Pet Friendly"],
      color: "Cognac Brown",
      color_hex: "#8b4513",
      pattern: "Textured Solid",
      texture: "Leather Grain",
      usage: "Sofas, Dining Chairs, Ottomans",
      abrasion_resistance: "100,000+ double rubs",
      is_featured: false,
      is_eco: false,
      stock_unit: "yard",
      min_order: 1,
      lead_time: "2-3 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "VIN-LEA-007",
        manage_inventory: true,
        inventory_quantity: 90,
        prices: [
          { amount: 4999, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "VIN-LEA-007-SWATCH",
        manage_inventory: true,
        inventory_quantity: 180,
        prices: [
          { amount: 500, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
  },
  
  // SHEER CURTAIN FABRIC
  {
    title: "Embroidered Sheer Voile",
    handle: "embroidered-sheer-voile",
    description: "Delicate sheer fabric with beautiful embroidered details. Perfect for layering with heavier curtains.",
    subtitle: "Decorative Sheer Curtain",
    material: "Polyester Voile",
    metadata: {
      category: "Curtains & Drapes",
      fabric_type: "Sheer",
      weight: "120 GSM",
      width: "118 inches",
      composition: "100% Polyester",
      care_instructions: "Machine washable, gentle cycle",
      features: ["Sheer", "Embroidered", "Light Weight", "Elegant"],
      color: "White with Gold Embroidery",
      color_hex: "#ffffff",
      pattern: "Embroidered Floral",
      texture: "Smooth Sheer",
      usage: "Sheer Curtains, Canopy, Decorative Draping",
      light_filtering: "Minimal",
      is_featured: false,
      is_eco: false,
      stock_unit: "yard",
      min_order: 3,
      lead_time: "2-3 business days"
    },
    status: "published",
    variants: [
      {
        title: "Per Yard",
        sku: "SHE-VOI-008",
        manage_inventory: true,
        inventory_quantity: 150,
        prices: [
          { amount: 2999, currency_code: "usd" }
        ],
        options: {
          "Unit": "Yard"
        }
      },
      {
        title: "Sample Swatch",
        sku: "SHE-VOI-008-SWATCH",
        manage_inventory: true,
        inventory_quantity: 250,
        prices: [
          { amount: 400, currency_code: "usd" }
        ],
        options: {
          "Unit": "Swatch"
        }
      }
    ],
    images: [
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200"
    ],
    thumbnail: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600"
  }
]

export default async function seedHomeFabrics(container: any) {
  console.log("🏠 Starting Home Fabric Products Seeding...")
  
  const productService = container.resolve("product")
  const regionService = container.resolve("region")
  
  try {
    // Get default region
    const regions = await regionService.list({})
    const defaultRegion = regions[0]
    
    if (!defaultRegion) {
      console.error("❌ No region found. Please create a region first.")
      process.exit(1)
    }
    
    console.log(`📍 Using region: ${defaultRegion.name} (${defaultRegion.currency_code})`)
    
    // Create products
    for (const productData of homeFabricProducts) {
      try {
        console.log(`\n📦 Creating product: ${productData.title}`)
        
        // Check if product already exists
        const existingProducts = await productService.list({
          handle: productData.handle
        })
        
        if (existingProducts.length > 0) {
          console.log(`⚠️  Product already exists: ${productData.title}`)
          continue
        }
        
        // Create the product
        const product = await productService.create({
          title: productData.title,
          handle: productData.handle,
          description: productData.description,
          subtitle: productData.subtitle,
          material: productData.material,
          status: productData.status,
          metadata: productData.metadata,
          images: productData.images.map(url => ({ url })),
          thumbnail: productData.thumbnail,
          options: [
            {
              title: "Unit",
              values: ["Yard", "Swatch"]
            }
          ]
        })
        
        console.log(`✅ Product created: ${product.title} (${product.id})`)
        
        // Create variants
        for (const variantData of productData.variants) {
          try {
            const variant = await productService.createVariant(product.id, {
              title: variantData.title,
              sku: variantData.sku,
              manage_inventory: variantData.manage_inventory,
              inventory_quantity: variantData.inventory_quantity,
              prices: variantData.prices.map(price => ({
                amount: price.amount,
                currency_code: price.currency_code,
                region_id: defaultRegion.id
              })),
              options: Object.entries(variantData.options).map(([key, value]) => ({
                option_id: product.options.find(o => o.title === key)?.id,
                value: value as string
              }))
            })
            
            console.log(`  ✅ Variant created: ${variant.title} - $${(variant.prices[0].amount / 100).toFixed(2)}`)
          } catch (variantError) {
            console.error(`  ❌ Failed to create variant ${variantData.title}:`, variantError.message)
          }
        }
        
      } catch (productError) {
        console.error(`❌ Failed to create product ${productData.title}:`, productError.message)
      }
    }
    
    console.log("\n🎉 Home Fabric Products Seeding Completed!")
    console.log(`📊 Total products to seed: ${homeFabricProducts.length}`)
    
    // List created products
    const allProducts = await productService.list({})
    console.log(`📦 Total products in database: ${allProducts.length}`)
    
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    throw error
  }
}