"use client"

import * as React from "react"
import { BarChart3, Calendar, FileText, Home, Package, Palette, Target } from 'lucide-react'

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

const data = {
  user: {
    name: "Sarah Johnson",
    email: "sarah@hearthstore.com",
    avatar: "/placeholder-user.jpg",
  },
  teams: [
    {
      name: "Hearth & Home Store",
      logo: Home,
      plan: "August 2025 Plan",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: BarChart3,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: "Posts",
      url: "/posts",
      icon: FileText,
    },
    {
      title: "Strategy",
      url: "/strategy",
      icon: Target,
    },
    {
      title: "Products & Promos",
      url: "/products",
      icon: Package,
    },
    {
      title: "Fabrics",
      url: "/fabrics",
      icon: Palette,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
