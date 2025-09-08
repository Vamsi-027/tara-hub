"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Eye,
  Edit,
  MoreVertical,
  Package,
  Trash2
} from "lucide-react"

interface Fabric {
  id: string
  name: string
  description?: string
  category?: string
  color?: string
  material?: string
  price?: number
  stock?: number
  imageUrl?: string
  status?: 'active' | 'inactive' | 'out_of_stock'
}

interface FabricCardEnhancedProps {
  fabric: Fabric
  onEdit?: (fabric: Fabric) => void
  onDelete?: (fabric: Fabric) => void
  onView?: (fabric: Fabric) => void
}

export function FabricCardEnhanced({ 
  fabric, 
  onEdit, 
  onDelete, 
  onView 
}: FabricCardEnhancedProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className={getStatusColor(fabric.status)}>
              {fabric.status || 'active'}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(fabric)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(fabric)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(fabric)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Fabric Image */}
          {fabric.imageUrl ? (
            <div className="aspect-square rounded-md overflow-hidden bg-gray-100">
              <img 
                src={fabric.imageUrl} 
                alt={fabric.name}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-md bg-gray-100 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Fabric Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm line-clamp-1">
              {fabric.name}
            </h3>
            
            {fabric.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {fabric.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{fabric.category || 'Uncategorized'}</span>
              {fabric.material && <span>{fabric.material}</span>}
            </div>

            {fabric.color && (
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: fabric.color.toLowerCase() }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {fabric.color}
                </span>
              </div>
            )}
          </div>

          {/* Price and Stock */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm">
              {fabric.price && (
                <span className="font-semibold">${fabric.price}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Stock: {fabric.stock || 0}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onView?.(fabric)}
              className="flex-1"
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
            <Button 
              size="sm" 
              onClick={() => onEdit?.(fabric)}
              className="flex-1"
            >
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FabricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Image skeleton */}
          <Skeleton className="aspect-square rounded-md" />

          {/* Content skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>

            <div className="flex items-center space-x-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Price and stock skeleton */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Actions skeleton */}
          <div className="flex space-x-2 pt-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}