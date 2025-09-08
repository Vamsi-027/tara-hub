"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  FileText,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Target,
  Layers
} from "lucide-react"

import { cn } from "@/components/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: Home,
      },
      {
        title: "Fabrics",
        href: "/admin/fabrics",
        icon: Layers,
      },
      {
        title: "Products", 
        href: "/admin/products",
        icon: Package,
      },
      {
        title: "Etsy Products",
        href: "/admin/etsy-products", 
        icon: ShoppingBag,
      }
    ]
  },
  {
    title: "Content",
    items: [
      {
        title: "Blog",
        href: "/admin/blog",
        icon: FileText,
      },
      {
        title: "Posts",
        href: "/admin/posts",
        icon: FileText,
      }
    ]
  },
  {
    title: "Management",
    items: [
      {
        title: "Team",
        href: "/admin/team",
        icon: Users,
      },
      {
        title: "Calendar",
        href: "/admin/calendar",
        icon: Calendar,
      },
      {
        title: "Strategy",
        href: "/admin/strategy",
        icon: Target,
      }
    ]
  }
]

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className={cn("w-64 bg-gray-900 text-white flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-700">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Layers className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">Tara Hub</span>
          <span className="truncate text-xs text-gray-300">Admin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 py-4 space-y-6">
        {navigation.map((group) => (
          <div key={group.title}>
            <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/admin" && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors",
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-700 text-gray-300">
            <Settings className="size-4" />
          </div>
          <div className="flex-1 text-left text-sm leading-tight">
            <div className="truncate font-medium">{user?.name || user?.email}</div>
            <div className="truncate text-xs text-gray-400">{user?.role}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="ml-auto size-8 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}