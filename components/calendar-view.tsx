"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { usePosts } from "@/hooks/use-posts"
import type { DBPost } from "@/lib/db-schema"
import { PostModal } from "@/components/post-modal"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = ["#fde68a", "#c4b5fd", "#93c5fd", "#6ee7b7", "#fca5a5", "#a5f3fc"]

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 15)) // August 2025
  const [channelFilter, setChannelFilter] = useState("All")
  const [boostFilter, setBoostFilter] = useState(false)
  const [selectedPost, setSelectedPost] = useState<DBPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view")

  // Get current month date range
  const startDate = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return `${year}-${String(month + 1).padStart(2, "0")}-01`
  }, [currentDate])

  const endDate = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  }, [currentDate])

  const { posts, loading, error, createPost, updatePost, deletePost } = usePosts({
    channel: channelFilter !== "All" ? channelFilter : undefined,
    boost: boostFilter,
    startDate,
    endDate,
  })

  const contentMixData = useMemo(() => {
    const typeCounts = posts.reduce(
      (acc, post) => {
        const type = post.type.split("/")[0].trim()
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
  }, [posts])

  const renderCalendar = () => {
    if (loading) {
      return Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="h-24" />)
    }

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const postsByDate = posts.reduce(
      (acc, post) => {
        acc[post.date] = acc[post.date] || []
        acc[post.date].push(post)
        return acc
      },
      {} as Record<string, DBPost[]>,
    )

    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/20 border border-border" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayPosts = postsByDate[dateStr] || []
      const hasContent = dayPosts.length > 0
      const hasLaunch = dayPosts.some((p) => p.event === "launch")
      const hasSale = dayPosts.some((p) => p.event === "sale")
      const hasBoosted = dayPosts.some((p) => p.boost)

      days.push(
        <div
          key={day}
          className={`h-24 border border-border p-2 relative cursor-pointer transition-colors hover:bg-muted/50 ${
            hasContent ? "bg-muted/30" : ""
          }`}
          onClick={() => {
            if (dayPosts.length > 0) {
              setSelectedPost(dayPosts[0])
              setModalMode("view")
              setIsModalOpen(true)
            }
          }}
        >
          <span className="text-sm font-medium">{day}</span>
          {hasContent && (
            <div className="absolute top-1 right-1 flex space-x-1">
              {hasLaunch && <div className="w-2 h-2 rounded-full bg-rose-500" title="Launch Day" />}
              {hasSale && <div className="w-2 h-2 rounded-full bg-amber-500" title="Sale/Promotion" />}
              {hasBoosted && <div className="w-2 h-2 rounded-full bg-emerald-500" title="Boosted Post" />}
            </div>
          )}
          {hasContent && <p className="text-xs mt-1 truncate text-muted-foreground">{dayPosts[0].idea}</p>}
        </div>,
      )
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleSavePost = async (postData: Partial<DBPost>) => {
    try {
      if (selectedPost && modalMode === "edit") {
        await updatePost(selectedPost.id, postData)
      } else if (modalMode === "create") {
        await createPost(postData as Omit<DBPost, "id" | "createdAt" | "updatedAt">)
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error saving post:", err)
    }
  }

  const handleDeletePost = async () => {
    if (selectedPost) {
      try {
        await deletePost(selectedPost.id)
        setIsModalOpen(false)
      } catch (err) {
        console.error("Error deleting post:", err)
      }
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Interactive Content Calendar</h1>
          <p className="text-destructive">Error loading calendar: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Interactive Content Calendar</h1>
        <p className="text-muted-foreground">
          Here is the day-by-day content plan for August. Click on any day with a colored background to see the detailed
          post plan. Use the filters to narrow your view by channel or to highlight posts slated for paid promotion.
        </p>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Channels</SelectItem>
                  <SelectItem value="IG">Instagram</SelectItem>
                  <SelectItem value="Pin">Pinterest</SelectItem>
                  <SelectItem value="FB">Facebook</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="boost-filter"
                  checked={boostFilter}
                  onCheckedChange={(checked) => setBoostFilter(checked as boolean)}
                />
                <label
                  htmlFor="boost-filter"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Boosted Only
                </label>
              </div>

              <div className="w-64 h-24">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ChartContainer config={{}} className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={contentMixData} cx="50%" cy="50%" innerRadius={20} outerRadius={35} dataKey="value">
                          {contentMixData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </div>
            </div>

            <Button
              onClick={() => {
                setSelectedPost(null)
                setModalMode("create")
                setIsModalOpen(true)
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">{renderCalendar()}</div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-muted/30 border border-border mr-2" />
              General Post
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
              Collection Launch
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
              Sale/Promotion
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
              Boosted Post
            </div>
          </div>
        </CardContent>
      </Card>

      <PostModal
        post={selectedPost}
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePost}
        onDelete={handleDeletePost}
      />
    </div>
  )
}
