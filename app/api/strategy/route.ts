import { type NextRequest, NextResponse } from "next/server"
import { getAllChannelStrategies, getAllSEOKeywords, getAllBlogPosts, getAllCreativeGuidelines } from "@/core/cache/providers/vercel-kv"
import type { APIResponse, StrategyResponse } from "@/core/database/schemas"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const blogPostLimit = searchParams.get("blogPostLimit")
      ? parseInt(searchParams.get("blogPostLimit") as string, 10)
      : undefined
    const blogPostOffset = searchParams.get("blogPostOffset") ? parseInt(searchParams.get("blogPostOffset") as string, 10) : undefined

    const [channels, seoKeywords, blogPosts, creativeGuidelines] = await Promise.all([
      getAllChannelStrategies(),
      getAllSEOKeywords(),
      getAllBlogPosts(),
      getAllCreativeGuidelines(),
    ])

    let paginatedBlogPosts = blogPosts
    if (blogPostLimit !== undefined && blogPostOffset !== undefined && !isNaN(blogPostLimit) && !isNaN(blogPostOffset)) {
      paginatedBlogPosts = blogPosts.slice(blogPostOffset, blogPostOffset + blogPostLimit)
    } else if (blogPostLimit !== undefined && !isNaN(blogPostLimit)) {
      paginatedBlogPosts = blogPosts.slice(0, blogPostLimit)
    }

    const response: APIResponse<StrategyResponse> = {
      success: true,
      data: {
        channels,
        seoKeywords,
        blogPosts: paginatedBlogPosts,
        creativeGuidelines,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching strategy data:", error)
    const response: APIResponse<StrategyResponse> = {
      success: false,
      error: "Failed to fetch strategy data",
    }
    return NextResponse.json(response, { status: 500 })
  }
}
