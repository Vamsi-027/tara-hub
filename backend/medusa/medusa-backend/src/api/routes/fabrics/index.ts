import { Router } from "express"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FabricService } from "../../../services/fabric.service"

export default (router: Router) => {
  // List all fabrics with optional filters
  router.get("/fabrics", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      
      const filters = {
        category: req.query.category as string,
        collection: req.query.collection as string,
        color_family: req.query.color_family as string,
        pattern: req.query.pattern as string,
        usage: req.query.usage as string,
        in_stock: req.query.in_stock ? req.query.in_stock === 'true' : undefined,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      }

      const [fabrics, count] = await fabricService.list(filters)
      
      res.json({
        fabrics,
        count,
        offset: filters.offset,
        limit: filters.limit,
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get fabric by ID
  router.get("/fabrics/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const fabric = await fabricService.retrieve(req.params.id)
      
      if (!fabric) {
        return res.status(404).json({ error: "Fabric not found" })
      }
      
      res.json({ fabric })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get fabric by SKU
  router.get("/fabrics/sku/:sku", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const fabric = await fabricService.retrieveBySku(req.params.sku)
      
      if (!fabric) {
        return res.status(404).json({ error: "Fabric not found" })
      }
      
      res.json({ fabric })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Search fabrics
  router.get("/fabrics/search/:query", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const fabrics = await fabricService.search(req.params.query)
      
      res.json({ fabrics })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get all collections
  router.get("/fabric-collections", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const collections = await fabricService.listCollections()
      
      // Map to the expected format
      const formattedCollections = collections.map(collection => ({
        id: collection.toLowerCase().replace(/\s+/g, '-'),
        name: collection,
        description: `Browse our ${collection} collection`,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80'
      }))
      
      res.json({ collections: formattedCollections })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Get all categories
  router.get("/fabric-categories", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const categories = await fabricService.listCategories()
      
      res.json({ categories })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Create new fabric (admin only - add auth middleware in production)
  router.post("/fabrics", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const fabric = await fabricService.create(req.body)
      
      res.status(201).json({ fabric })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Update fabric (admin only - add auth middleware in production)
  router.put("/fabrics/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const fabric = await fabricService.update(req.params.id, req.body)
      
      res.json({ fabric })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Update stock
  router.patch("/fabrics/sku/:sku/stock", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const { quantity } = req.body
      
      if (typeof quantity !== 'number') {
        return res.status(400).json({ error: "Quantity must be a number" })
      }
      
      const fabric = await fabricService.updateStock(req.params.sku, quantity)
      
      res.json({ fabric })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Delete fabric (admin only - add auth middleware in production)
  router.delete("/fabrics/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      await fabricService.delete(req.params.id)
      
      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Bulk create fabrics (admin only - add auth middleware in production)
  router.post("/fabrics/bulk", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const fabricService: FabricService = req.scope.resolve("fabricService")
      const { fabrics } = req.body
      
      if (!Array.isArray(fabrics)) {
        return res.status(400).json({ error: "Fabrics must be an array" })
      }
      
      const created = await fabricService.bulkCreate(fabrics)
      
      res.status(201).json({ fabrics: created, count: created.length })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}