"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { usePosts } from "@/hooks/use-posts"
import type { DBPost } from "@/lib/db-schema"
import { PostModal } from "@/components/post-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

export function PostsView() {
  const [channelFilter, setChannelFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [themeFilter, setThemeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedPost, setSelectedPost] = useState<DBPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { posts, loading, error } = usePosts({
    channel: channelFilter !== "All" ? channelFilter : undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
  })

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const typeMatch = typeFilter === "All" || post.type.startsWith(typeFilter)
      const themeMatch = themeFilter === "All" || post.theme === themeFilter
      return typeMatch && themeMatch
    })
  }, [posts, typeFilter, themeFilter])

  const channels = ["IG", "FB", "Pin"]
  const postTypes = [...new Set(posts.map((p) => p.type.split("/")[0].trim()))]
  const themes = [...new Set(posts.map((p) => p.theme))]
  const statuses = ["Draft", "Scheduled", "Published"]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Published":
        return "default"
      case "Scheduled":
        return "secondary"
      case "Draft":
        return "outline"
      default:
        return "outline"
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-destructive">Error loading posts: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Discover, filter, and manage all your social media posts from this central hub.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Channel
              </label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Post Type
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {postTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Theme
              </label>
              <Select value={themeFilter} onValueChange={setThemeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {themes.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => {
                setSelectedPost(post)
                setIsModalOpen(true)
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{post.idea}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      | {post.theme}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(post.status)}>{post.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : posts.length === 0 ? (
          <EmptyState 
            type="posts"
            onAction={() => {
              // This could trigger the post creation modal
              setSelectedPost(null)
              setIsModalOpen(true)
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No posts match the current filters.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <PostModal
        post={selectedPost}
        mode="view"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(post) => {
          console.log("Saving post:", post)
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
