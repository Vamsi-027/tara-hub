"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { fabricSeedData, Fabric } from "@/lib/fabric-seed-data"
import { FabricForm } from "./fabric-form"

export function FabricsView() {
  const [fabrics, setFabrics] = useState<Fabric[]>(fabricSeedData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null)

  const filteredFabrics = fabrics.filter(fabric =>
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.color.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddFabric = (fabricData: Partial<Fabric>) => {
    const newFabric: Fabric = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...fabricData,
    } as Fabric
    setFabrics([...fabrics, newFabric])
    setIsAddDialogOpen(false)
  }

  const handleEditFabric = (fabricData: Partial<Fabric>) => {
    if (editingFabric) {
      setFabrics(fabrics.map(f => 
        f.id === editingFabric.id ? { ...f, ...fabricData, updatedAt: new Date().toISOString() } : f
      ))
      setEditingFabric(null)
    }
  }

  const handleDeleteFabric = (id: string) => {
    setFabrics(fabrics.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fabric Products Library</h1>
          <p className="text-muted-foreground">Manage your fabric inventory and product catalog</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Fabric
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Fabric</DialogTitle>
            </DialogHeader>
            <FabricForm
              onSubmit={handleAddFabric}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.filter(f => f.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Featured Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.filter(f => f.isFeatured).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fabrics.filter(f => f.stockQuantity < 50).length}</div>
          </CardContent>
        </Card>
      </div>

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
                  <TableCell className="font-medium">{fabric.name}</TableCell>
                  <TableCell>{fabric.sku}</TableCell>
                  <TableCell>{fabric.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {fabric.colorHex && (
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: fabric.colorHex }}
                        />
                      )}
                      {fabric.color}
                    </div>
                  </TableCell>
                  <TableCell>{fabric.manufacturer}</TableCell>
                  <TableCell>${fabric.pricePerYard}</TableCell>
                  <TableCell>
                    <Badge variant={fabric.stockQuantity < 50 ? "destructive" : "secondary"}>
                      {fabric.stockQuantity} yards
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {fabric.isActive && <Badge variant="secondary">Active</Badge>}
                      {fabric.isFeatured && <Badge variant="default">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingFabric(fabric)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteFabric(fabric.id)}
                          className="text-destructive"
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

      <Dialog open={!!editingFabric} onOpenChange={() => setEditingFabric(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fabric</DialogTitle>
          </DialogHeader>
          {editingFabric && (
            <FabricForm
              fabric={editingFabric}
              onSubmit={handleEditFabric}
              onCancel={() => setEditingFabric(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
