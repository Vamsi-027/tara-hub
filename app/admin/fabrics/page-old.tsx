"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { fabricSeedData } from "@/modules/fabrics/data/seed-data"
import { EmptyState } from "@/components/empty-state"
import { FabricModal } from "@/components/fabric-modal"
import type { Fabric } from "@/shared/types"

export default function AdminFabricsPage() {
  const [fabrics, setFabrics] = useState(fabricSeedData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  
  const filteredFabrics = fabrics.filter(fabric => 
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.color.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this fabric?")) {
      setFabrics(fabrics.filter(f => f.id !== id))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fabrics Management</h1>
          <p className="text-muted-foreground">
            Manage your fabric inventory, add new products, and update existing ones.
          </p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => {
            setSelectedFabric(null)
            setModalMode("create")
            setIsModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add New Fabric
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search fabrics by name, category, or color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Fabrics List */}
      {filteredFabrics.length === 0 ? (
        <EmptyState 
          type="products"
          title="No fabrics found"
          description="No fabrics match your search criteria. Try adjusting your search or add a new fabric."
          actionLabel="Add First Fabric"
          onAction={() => {
            setSelectedFabric(null)
            setModalMode("create")
            setIsModalOpen(true)
          }}
        />
      ) : (
        <div className="grid gap-4">
          {filteredFabrics.map((fabric) => (
            <Card key={fabric.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{fabric.name}</h3>
                      <Badge variant="secondary">{fabric.category}</Badge>
                      <Badge variant="outline">{fabric.color}</Badge>
                      {fabric.inStock && (
                        <Badge variant="default" className="bg-green-500">In Stock</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{fabric.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="font-medium">${fabric.pricePerYard}/yard</span>
                      <span className="text-muted-foreground">Width: {fabric.width}"</span>
                      <span className="text-muted-foreground">Composition: {fabric.composition}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedFabric(fabric)
                        setModalMode("edit")
                        setIsModalOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(fabric.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fabric Modal */}
      <FabricModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedFabric(null)
        }}
        onSave={(fabricData) => {
          if (modalMode === "create") {
            // Add new fabric with generated ID
            const newFabric = {
              ...fabricData,
              id: `fabric-${Date.now()}`,
            } as Fabric
            setFabrics([...fabrics, newFabric])
          } else if (modalMode === "edit" && selectedFabric) {
            // Update existing fabric
            setFabrics(fabrics.map(f => 
              f.id === selectedFabric.id 
                ? { ...f, ...fabricData } as Fabric
                : f
            ))
          }
          setIsModalOpen(false)
          setSelectedFabric(null)
        }}
        fabric={selectedFabric}
        mode={modalMode}
      />
    </div>
  )
}