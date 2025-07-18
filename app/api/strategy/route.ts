import { NextResponse } from "next/server"
import { getAllChannelStrategies, getAllSEOKeywords, getAllBlogPosts, getAllCreativeGuidelines } from "@/lib/kv"
import type { APIResponse, StrategyResponse } from "@/lib/db-schema"

export async function GET() {
  try {
    const [channels, seoKeywords, blogPosts, creativeGuidelines] = await Promise.all([
      getAllChannelStrategies(),
      getAllSEOKeywords(),
      getAllBlogPosts(),
      getAllCreativeGuidelines(),
    ])

    const response: APIResponse<StrategyResponse> = {
      success: true,
      data: {
        channels,
        seoKeywords,
        blogPosts,
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
