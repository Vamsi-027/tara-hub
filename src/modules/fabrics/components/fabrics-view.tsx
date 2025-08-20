"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { FabricForm } from "@/components/fabric-form"
import { seedFabrics } from "@/modules/fabrics/data/seed-data"
import type { DBFabric } from "@/core/database/schemas"

export function FabricsView() {
  const [fabrics, setFabrics] = useState<DBFabric[]>(
    seedFabrics.map((fabric, index) => ({
      ...fabric,
      id: `fabric_${index + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFabric, setEditingFabric] = useState<DBFabric | null>(null)

  const filteredFabrics = fabrics.filter(fabric =>
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddFabric = () => {
    setEditingFabric(null)
    setIsDialogOpen(true)
  }

  const handleEditFabric = (fabric: DBFabric) => {
    setEditingFabric(fabric)
    setIsDialogOpen(true)
  }

  const handleDeleteFabric = (fabricId: string) => {
    setFabrics(prev => prev.filter(f => f.id !== fabricId))
  }

  const handleSubmitFabric = (fabricData: Omit<DBFabric, "id" | "createdAt" | "updatedAt">) => {
    if (editingFabric) {
      // Update existing fabric
      setFabrics(prev => prev.map(f => 
        f.id === editingFabric.id 
          ? { ...fabricData, id: f.id, createdAt: f.createdAt, updatedAt: new Date().toISOString() }
          : f
      ))
    } else {
      // Add new fabric
      const newFabric: DBFabric = {
        ...fabricData,
        id: `fabric_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setFabrics(prev => [...prev, newFabric])
    }
    setIsDialogOpen(false)
    setEditingFabric(null)
  }

  const handleCancelForm = () => {
    setIsDialogOpen(false)
    setEditingFabric(null)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fabric Library</h1>
          <p className="text-muted-foreground">Manage your fabric inventory and specifications</p>
        </div>
        <Button onClick={handleAddFabric}>
          <Plus className="h-4 w-4 mr-2" />
          Add Fabric
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.filter(f => f.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.filter(f => f.isFeatured).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.filter(f => f.stockQuantity < 10).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fabrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Fabrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fabric Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Price/Yard</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFabrics.map((fabric) => (
                <TableRow key={fabric.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {fabric.swatchImageUrl && (
                        <img 
                          src={fabric.swatchImageUrl || "/placeholder.svg"} 
                          alt={fabric.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span>{fabric.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{fabric.sku || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{fabric.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {fabric.colorHex && (
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: fabric.colorHex }}
                        />
                      )}
                      <span>{fabric.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>{fabric.manufacturer}</TableCell>
                  <TableCell>${fabric.pricePerYard.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={fabric.stockQuantity < 10 ? "text-red-600" : ""}>
                      {fabric.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {fabric.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                      {fabric.isFeatured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditFabric(fabric)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteFabric(fabric.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Fabric Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFabric ? 'Edit Fabric' : 'Add New Fabric'}
            </DialogTitle>
          </DialogHeader>
          <FabricForm
            fabric={editingFabric || undefined}
            onSubmit={handleSubmitFabric}
            onCancel={handleCancelForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
