import { type NextRequest, NextResponse } from "next/server"
import { getAllPosts, createPost } from "@/lib/kv"
import type { APIResponse, PostsResponse, DBPost } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get("channel")
    const status = searchParams.get("status")
    const theme = searchParams.get("theme")
    const boost = searchParams.get("boost")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let posts = await getAllPosts()

    // Apply filters
    if (channel && channel !== "All") {
      posts = posts.filter((post) => post.channels.includes(channel) || post.channels.includes("All"))
    }

    if (status && status !== "All") {
      posts = posts.filter((post) => post.status === status)
    }

    if (theme && theme !== "All") {
      posts = posts.filter((post) => post.theme === theme)
    }

    if (boost === "true") {
      posts = posts.filter((post) => post.boost)
    }

    if (startDate) {
      posts = posts.filter((post) => post.date >= startDate)
    }

    if (endDate) {
      posts = posts.filter((post) => post.date <= endDate)
    }

    // Sort by date
    posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const response: APIResponse<PostsResponse> = {
      success: true,
      data: {
        posts,
        total: posts.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching posts:", error)
    const response: APIResponse<PostsResponse> = {
      success: false,
      error: "Failed to fetch posts",
    }
    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["date", "idea", "goal", "type", "channels"]
    for (const field of requiredFields) {
      if (!body[field]) {
        const response: APIResponse<DBPost> = {
          success: false,
          error: `Missing required field: ${field}`,
        }
        return NextResponse.json(response, { status: 400 })
      }
    }

    // Set default values
    const postData = {
      ...body,
      status: body.status || "Draft",
      theme: body.theme || "Custom",
      copy: body.copy || "",
      keywords: body.keywords || "",
      hashtags: body.hashtags || "",
      cta: body.cta || "",
      kpi: body.kpi || "Track Manually",
      notes: body.notes || "",
      boost: body.boost || false,
    }

    const newPost = await createPost(postData)

    const response: APIResponse<DBPost> = {
      success: true,
      data: newPost,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error creating post:", error)
    const response: APIResponse<DBPost> = {
      success: false,
      error: "Failed to create post",
    }
    return NextResponse.json(response, { status: 500 })
  }
}
