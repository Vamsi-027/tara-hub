import React, { useEffect, useState } from "react"
import { ProductDetailsWidgetProps, WidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import MaterialSelect from "../components/MaterialSelect"

const ProductMaterialSelect: React.FC<ProductDetailsWidgetProps> = ({ product }) => {
  const [materialId, setMaterialId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const initial = (product as any)?.material_id ?? null
    setMaterialId(initial)
  }, [product])

  const handleSave = async () => {
    if (!product?.id) return
    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_id: materialId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Failed to save material")
      }
      toast.success("Material saved for product")
    } catch (e: any) {
      toast.error(e?.message || "Failed to save material")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Material</Heading>
        <Text className="text-ui-fg-subtle mt-1">Associate this product with a material</Text>
      </div>
      <div className="px-6 py-4 space-y-4">
        <MaterialSelect value={materialId} onChange={setMaterialId} />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Material"}</Button>
        </div>
      </div>
    </Container>
  )
}

export const config: WidgetConfig = {
  zone: "product.details.after",
}

export default ProductMaterialSelect
