import React, { useEffect, useMemo, useState } from "react"
import { WidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import MaterialSelect from "../components/MaterialSelect"

type Material = { id: string; name?: string }

type VariantWidgetProps = {
  product?: { id?: string }
  variant?: { id?: string; materials?: Material[] | null }
}

const VariantMaterialSelect: React.FC<VariantWidgetProps> = ({ product, variant }) => {
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])
  const [pendingValue, setPendingValue] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const materials = Array.isArray((variant as any)?.materials)
      ? ((variant as any).materials as Material[])
      : []

    const normalized = materials
      .filter((m) => Boolean(m?.id))
      .map((m) => ({ id: m!.id!, name: m!.name ?? m!.id! }))

    setSelectedMaterials(normalized)
    setPendingValue(null)
  }, [variant])

  const selectedIds = useMemo(() => new Set(selectedMaterials.map((m) => m.id)), [selectedMaterials])

  const handleMaterialPick = (material: Material | null) => {
    if (!material?.id) {
      return
    }

    if (selectedIds.has(material.id)) {
      toast.info(`${material.name ?? material.id} is already linked to this variant.`)
      setPendingValue(null)
      return
    }

    setSelectedMaterials((prev) => [...prev, { id: material.id, name: material.name ?? material.id }])
    setPendingValue(null)
  }

  const handleRemove = (materialId: string) => {
    setSelectedMaterials((prev) => prev.filter((m) => m.id !== materialId))
  }

  const handleClearAll = () => {
    setSelectedMaterials([])
  }

  const handleSave = async () => {
    if (!product?.id || !variant?.id) {
      return
    }

    setSaving(true)

    try {
      const materialIds = selectedMaterials.map((m) => m.id)
      const res = await fetch(`/admin/products/${product.id}/variants/${variant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_ids: materialIds }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 409 && payload?.code === "MATERIAL_LINK_CONFLICT") {
          toast.error("Duplicate material assignment detected. Remove existing links before adding duplicates.")
          return
        }

        throw new Error(payload?.error || "Failed to save materials")
      }

      const updated = Array.isArray(payload?.variant?.materials)
        ? (payload.variant.materials as Material[]).map((m) => ({ id: m.id, name: m.name ?? m.id }))
        : materialIds.map((id) => ({ id, name: id }))

      setSelectedMaterials(updated)
      toast.success(`Saved ${updated.length} material${updated.length === 1 ? "" : "s"} for variant`)
    } catch (error: any) {
      toast.error(error?.message || "Failed to save materials")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Materials</Heading>
        <Text className="text-ui-fg-subtle mt-1">Link one or more materials to this variant.</Text>
      </div>
      <div className="px-6 py-4 space-y-4">
        <MaterialSelect
          value={pendingValue}
          onChange={setPendingValue}
          onSelect={handleMaterialPick}
          placeholder="Search and add materials"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text weight="plus" className="text-base">
              Selected Materials
            </Text>
            <Button
              variant="secondary"
              size="small"
              onClick={handleClearAll}
              disabled={saving || selectedMaterials.length === 0}
            >
              Clear All
            </Button>
          </div>
          {selectedMaterials.length === 0 ? (
            <Text size="small" className="text-ui-fg-subtle">
              No materials selected.
            </Text>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center gap-2 rounded-md border border-ui-border px-3 py-1 text-sm"
                >
                  <span>{material.name ?? material.id}</span>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => handleRemove(material.id)}
                    disabled={saving}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Materials"}
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config: WidgetConfig = {
  zone: "product.variants.details.after",
}

export default VariantMaterialSelect
