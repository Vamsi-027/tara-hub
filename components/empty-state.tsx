import * as React from "react"
import { 
  Calendar, 
  Package, 
  MessageSquare, 
  Target, 
  Plus,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const iconMap = {
  calendar: Calendar,
  products: Package,
  posts: MessageSquare,
  strategy: Target,
  default: FileText,
} as const

type ContentType = keyof typeof iconMap

interface EmptyStateProps {
  type: ContentType
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const defaultContent: Record<ContentType | "default", {
  title: string
  description: string
  actionLabel: string
}> = {
  calendar: {
    title: "No posts scheduled",
    description: "Start planning your content strategy by creating your first post. Use the calendar to visualize and organize your content across different channels.",
    actionLabel: "Create First Post"
  },
  posts: {
    title: "No posts created yet", 
    description: "Build your content library by creating posts for your social media channels. Organize them by theme, type, and publishing status.",
    actionLabel: "Create First Post"
  },
  products: {
    title: "No product data available",
    description: "Set up your merchandising strategy by defining hero categories, launch pipelines, and promotional frameworks to drive sales.",
    actionLabel: "Add Product Strategy"
  },
  strategy: {
    title: "No strategy defined",
    description: "Create your strategic framework by setting up channel-specific plans, SEO keywords, and creative guidelines to guide your brand approach.",
    actionLabel: "Define Strategy"
  },
  default: {
    title: "No content available",
    description: "Get started by creating your first item.",
    actionLabel: "Create Item"
  }
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  const IconComponent = iconMap[type] || iconMap.default
  const content = defaultContent[type] || defaultContent.default

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
          <IconComponent className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          {title || content.title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
          {description || content.description}
        </p>
        
        {onAction && (
          <Button onClick={onAction} className="gap-2">
            <Plus className="h-4 w-4" />
            {actionLabel || content.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}