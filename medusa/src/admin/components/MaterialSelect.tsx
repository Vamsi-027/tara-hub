import React, { useEffect, useMemo, useState } from "react"
import { Select, Label, Button, Input, Text } from "@medusajs/ui"

type Material = { id: string; name: string }

type Props = {
  value: string | null
  onChange: (id: string | null) => void
  label?: string
  placeholder?: string
  allowClear?: boolean
}

const MaterialSelect: React.FC<Props> = ({ value, onChange, label = "Material", placeholder = "Select a material", allowClear = true }) => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let aborted = false
    const fetchMaterials = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (q && q.length >= 1) params.set("q", q)
        params.set("limit", "50")
        const res = await fetch(`/admin/materials?${params.toString()}`)
        if (!res.ok) throw new Error("Failed to load materials")
        const data = await res.json()
        if (!aborted) setMaterials((data.materials || []) as Material[])
      } catch (e) {
        if (!aborted) setMaterials([])
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    const t = setTimeout(fetchMaterials, 200)
    return () => { aborted = true; clearTimeout(t) }
  }, [q])

  const items = useMemo(() => materials.map((m) => ({ label: m.name, value: m.id })), [materials])

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search materials"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 w-48"
          />
          {allowClear && value && (
            <Button size="small" variant="secondary" onClick={() => onChange(null)}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <Select value={value ?? undefined} onValueChange={(v) => onChange(v || null)}>
        <Select.Trigger>
          <Select.Value placeholder={loading ? "Loading..." : placeholder} />
        </Select.Trigger>
        <Select.Content>
          {items.length === 0 && (
            <div className="px-3 py-2 text-ui-fg-subtle">
              <Text size="small">{loading ? "Loading..." : "No materials found"}</Text>
            </div>
          )}
          {items.map((opt) => (
            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  )
}

export default MaterialSelect

