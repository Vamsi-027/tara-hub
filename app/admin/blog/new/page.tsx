"use client"

import { BlogEditor } from '@/components/blog-editor'

export default function NewBlogPostPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BlogEditor />
    </div>
  )
}