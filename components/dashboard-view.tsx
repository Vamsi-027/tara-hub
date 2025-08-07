"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, TrendingUp, MessageSquare, Eye, Heart, Share2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

const engagementData = [
  { name: 'Mon', posts: 4, engagement: 240 },
  { name: 'Tue', posts: 3, engagement: 180 },
  { name: 'Wed', posts: 5, engagement: 320 },
  { name: 'Thu', posts: 2, engagement: 150 },
  { name: 'Fri', posts: 6, engagement: 410 },
  { name: 'Sat', posts: 4, engagement: 280 },
  { name: 'Sun', posts: 3, engagement: 200 },
]

const platformData = [
  { name: 'Instagram', value: 45, color: '#E1306C' },
  { name: 'Facebook', value: 30, color: '#1877F2' },
  { name: 'Twitter', value: 15, color: '#1DA1F2' },
  { name: 'LinkedIn', value: 10, color: '#0A66C2' },
]

const recentPosts = [
  {
    id: 1,
    title: "New Linen Collection Launch",
    platform: "Instagram",
    status: "Published",
    engagement: { likes: 245, comments: 18, shares: 12 },
    date: "2024-01-15"
  },
  {
    id: 2,
    title: "Behind the Scenes: Fabric Sourcing",
    platform: "Facebook",
    status: "Scheduled",
    engagement: { likes: 0, comments: 0, shares: 0 },
    date: "2024-01-16"
  },
  {
    id: 3,
    title: "Customer Spotlight: Living Room Makeover",
    platform: "Instagram",
    status: "Draft",
    engagement: { likes: 0, comments: 0, shares: 0 },
    date: "2024-01-17"
  }
]

export function DashboardView() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Media Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your social media performance and manage content</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Followers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">
              +25% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Engagement</CardTitle>
            <CardDescription>Posts and engagement over the last week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Engagement by social media platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest social media content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{post.platform}</Badge>
                    <Badge 
                      variant={post.status === 'Published' ? 'default' : post.status === 'Scheduled' ? 'secondary' : 'outline'}
                    >
                      {post.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{post.date}</span>
                  </div>
                </div>
                
                {post.status === 'Published' && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.engagement.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {post.engagement.comments}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      {post.engagement.shares}
                    </div>
                  </div>
                )}
                
                <Button variant="outline" size="sm" className="ml-4">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
