"use client"

import { useState, useEffect } from "react"
import type { DBPost } from "@/lib/db-schema"

interface UsePostsOptions {
  channel?: string
  status?: string
  theme?: string
  boost?: boolean
  startDate?: string
  endDate?: string
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<DBPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.channel) params.append("channel", options.channel)
      if (options.status) params.append("status", options.status)
      if (options.theme) params.append("theme", options.theme)
      if (options.boost) params.append("boost", "true")
      if (options.startDate) params.append("startDate", options.startDate)
      if (options.endDate) params.append("endDate", options.endDate)

      const response = await fetch(`/api/posts?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setPosts(result.data.posts)
      } else {
        setError(result.error || "Failed to fetch posts")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching posts:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [options.channel, options.status, options.theme, options.boost, options.startDate, options.endDate])

  const createPost = async (postData: Omit<DBPost, "id" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })

      const result = await response.json()

      if (result.success) {
        await fetchPosts() // Refresh the list
        return result.data
      } else {
        throw new Error(result.error || "Failed to create post")
      }
    } catch (err) {
      console.error("Error creating post:", err)
      throw err
    }
  }

  const updatePost = async (id: string, updates: Partial<DBPost>) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (result.success) {
        await fetchPosts() // Refresh the list
        return result.data
      } else {
        throw new Error(result.error || "Failed to update post")
      }
    } catch (err) {
      console.error("Error updating post:", err)
      throw err
    }
  }

  const deletePost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        await fetchPosts() // Refresh the list
        return true
      } else {
        throw new Error(result.error || "Failed to delete post")
      }
    } catch (err) {
      console.error("Error deleting post:", err)
      throw err
    }
  }

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
    createPost,
    updatePost,
    deletePost,
  }
}
