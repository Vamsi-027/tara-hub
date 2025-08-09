"use client"

import * as React from "react"
import { BarChart3, Calendar, FileText, Home, Package, Palette, Target, BookOpen } from 'lucide-react'
import Link from "next/link"
import { useSession } from "next-auth/react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Hearth & Home",
      logo: "/placeholder-logo.svg",
      plan: "August 2025 Plan",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home,
      isActive: true,
    },
    {
      title: "Calendar",
      url: "/admin/calendar",
      icon: Calendar,
    },
    {
      title: "Blog",
      url: "/admin/blog",
      icon: BookOpen,
    },
    {
      title: "Posts",
      url: "/admin/posts",
      icon: FileText,
    },
    {
      title: "Strategy",
      url: "/admin/strategy",
      icon: Target,
    },
    {
      title: "Products & Promos",
      url: "/admin/products",
      icon: Package,
    },
    {
      title: "Fabrics",
      url: "/admin/fabrics",
      icon: Palette,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  
  const user = {
    name: session?.user?.name || "Admin",
    email: session?.user?.email || "admin@tarahub.com",
    avatar: session?.user?.image || "/placeholder-user.jpg",
  }
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
