"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/components/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {Icon && (
          <div className="mb-4">
            <Icon className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="mt-6">
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}