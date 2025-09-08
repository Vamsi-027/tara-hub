"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  FileText,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Activity,
  Plus,
  BarChart3
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for stats

const stats = [
  {
    title: "Total Fabrics",
    value: "847",
    change: "+12%",
    changeType: "positive" as const,
    icon: Package,
    href: "/admin/fabrics"
  },
  {
    title: "Products",
    value: "234", 
    change: "+5%",
    changeType: "positive" as const,
    icon: ShoppingBag,
    href: "/admin/products"
  },
  {
    title: "Blog Posts",
    value: "23",
    change: "+2",
    changeType: "positive" as const,
    icon: FileText,
    href: "/admin/blog"
  },
  {
    title: "Team Members",
    value: "8",
    change: "+1",
    changeType: "positive" as const,
    icon: Users,
    href: "/admin/team"
  }
]

const recentActivity = [
  {
    action: "New fabric added",
    description: "Cotton Blend Canvas - Navy Blue",
    time: "2 hours ago",
    type: "fabric"
  },
  {
    action: "Blog post published",
    description: "Summer Fabric Collection 2024",
    time: "4 hours ago", 
    type: "blog"
  },
  {
    action: "Team member invited",
    description: "sarah@example.com invited as Editor",
    time: "1 day ago",
    type: "team"
  },
  {
    action: "Product updated",
    description: "Silk Scarf Collection - price updated",
    time: "2 days ago",
    type: "product"
  }
]

export function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/admin/fabrics/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Fabric
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={`${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    {" "}from last month
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto mt-2">
                    <Link href={stat.href} className="text-xs">
                      View details →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Monthly fabric and product sales
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="w-full h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Sales Chart</p>
                    <p className="text-sm text-gray-400">Chart visualization would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Website Traffic</CardTitle>
                <CardDescription>
                  Weekly visitors and page views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Traffic Analytics</p>
                    <p className="text-sm text-gray-400">Line chart would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used admin functions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/fabrics/import">
                    <Package className="mr-2 h-4 w-4" />
                    Import Fabrics
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/blog/new">
                    <FileText className="mr-2 h-4 w-4" />
                    New Blog Post
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/team">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Team
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/calendar">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Calendar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Activity Log
              </CardTitle>
              <CardDescription>
                Detailed activity across all admin functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...recentActivity, ...recentActivity.slice(0, 3)].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 rounded-lg border p-4">
                    <div className={`rounded-full p-2 ${
                      activity.type === 'fabric' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'blog' ? 'bg-green-100 text-green-600' :
                      activity.type === 'team' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'fabric' ? <Package className="h-4 w-4" /> :
                       activity.type === 'blog' ? <FileText className="h-4 w-4" /> :
                       activity.type === 'team' ? <Users className="h-4 w-4" /> :
                       <ShoppingBag className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}