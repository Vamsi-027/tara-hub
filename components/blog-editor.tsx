"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Link,
  Image,
  Code,
  Save,
  Eye,
  Send,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface BlogPostData {
  id?: string
  slug?: string
  title: string
  excerpt: string
  content: string
  featuredImage?: string
  author?: {
    name: string
    email?: string
    role?: string
  }
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
}

interface BlogEditorProps {
  post?: BlogPostData
  isEdit?: boolean
}

const categories = [
  'Home Decor',
  'Outdoor Living',
  'Safety',
  'Gift Ideas',
  'Seasonal Decor',
  'DIY & Tips',
  'Product Updates',
  'Customer Stories'
]

export function BlogEditor({ post, isEdit = false }: BlogEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BlogPostData>({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    featuredImage: post?.featuredImage || '',
    category: post?.category || 'Home Decor',
    tags: post?.tags || [],
    status: post?.status || 'draft',
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || '',
    seoKeywords: post?.seoKeywords || [],
    ...post
  })
  const [tagInput, setTagInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  const handleChange = (field: keyof BlogPostData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    handleChange('tags', formData.tags.filter(t => t !== tag))
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.seoKeywords?.includes(keywordInput.trim())) {
      handleChange('seoKeywords', [...(formData.seoKeywords || []), keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    handleChange('seoKeywords', formData.seoKeywords?.filter(k => k !== keyword) || [])
  }

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.content.substring(start, end)
    const newText = formData.content.substring(0, start) + 
                   before + selectedText + after + 
                   formData.content.substring(end)
    
    handleChange('content', newText)
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required')
      return
    }

    setLoading(true)
    try {
      const url = isEdit ? `/api/blog/${post?.id}` : '/api/blog'
      const method = isEdit ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status,
          author: formData.author || {
            name: 'Admin',
            role: 'Content Creator'
          }
        }),
      })

      if (response.ok) {
        toast.success(
          status === 'published' 
            ? 'Blog post published successfully!' 
            : 'Blog post saved as draft!'
        )
        router.push('/admin/blog')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save blog post')
      }
    } catch (error) {
      console.error('Error saving blog post:', error)
      toast.error('An error occurred while saving')
    } finally {
      setLoading(false)
    }
  }

  const renderPreview = () => {
    const formatContent = (content: string) => {
      return content
        .split('\n')
        .map((line, index) => {
          // Headers
          if (line.startsWith('### ')) {
            return `<h3 class="text-xl font-semibold mt-6 mb-3">${line.substring(4)}</h3>`
          }
          if (line.startsWith('## ')) {
            return `<h2 class="text-2xl font-bold mt-8 mb-4">${line.substring(3)}</h2>`
          }
          if (line.startsWith('# ')) {
            return `<h1 class="text-3xl font-bold mb-6">${line.substring(2)}</h1>`
          }
          
          // Lists
          if (line.startsWith('- ')) {
            return `<li class="ml-6 mb-2">• ${line.substring(2)}</li>`
          }
          if (line.match(/^\d+\. /)) {
            return `<li class="ml-6 mb-2">${line}</li>`
          }
          
          // Bold and italic
          line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
          line = line.replace(/\*(.*?)\*/g, '<em>$1</em>')
          
          // Links
          line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
          
          // Paragraphs
          if (line.trim() === '') {
            return '<br />'
          }
          
          return `<p class="mb-4">${line}</p>`
        })
        .join('')
    }

    return (
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-4">{formData.title}</h1>
        {formData.excerpt && (
          <p className="text-xl text-gray-600 mb-8">{formData.excerpt}</p>
        )}
        <div dangerouslySetInnerHTML={{ __html: formatContent(formData.content) }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
          <CardDescription>
            Write engaging content for your blog. Use markdown for formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO Settings</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter blog post title..."
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Brief description of your post..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featuredImage">Featured Image URL</Label>
                  <Input
                    id="featuredImage"
                    value={formData.featuredImage}
                    onChange={(e) => handleChange('featuredImage', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content-editor">Content *</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('**', '**')}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('*', '*')}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('## ')}
                    >
                      <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('### ')}
                    >
                      <Heading3 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('- ')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('1. ')}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('> ')}
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('`', '`')}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('[', '](url)')}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertMarkdown('![alt text](', ')')}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="content-editor"
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  placeholder="Write your blog post content here... (Supports Markdown)"
                  rows={20}
                  className="font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleChange('seoTitle', e.target.value)}
                  placeholder="SEO optimized title (defaults to post title)"
                />
                <p className="text-sm text-gray-500">
                  {formData.seoTitle?.length || 0}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => handleChange('seoDescription', e.target.value)}
                  placeholder="Meta description for search engines (defaults to excerpt)"
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  {formData.seoDescription?.length || 0}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    id="seoKeywords"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Add a keyword..."
                  />
                  <Button type="button" onClick={handleAddKeyword} variant="outline">
                    Add Keyword
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.seoKeywords?.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="min-h-[500px]">
              <Card>
                <CardContent className="pt-6">
                  {renderPreview()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/blog')}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSave('published')}
                disabled={loading}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}