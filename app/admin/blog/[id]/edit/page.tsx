"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BlogEditor } from '@/components/blog-editor'
import { toast } from 'sonner'

export default function EditBlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      } else {
        toast.error('Failed to fetch blog post')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Error loading blog post')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-center">Blog post not found</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BlogEditor post={post} isEdit={true} />
    </div>
  )
}