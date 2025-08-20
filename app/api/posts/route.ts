import { type NextRequest, NextResponse } from "next/server"
import { getAllPosts, createPost } from "@/core/cache/providers/vercel-kv"
import type { APIResponse, PostsResponse, DBPost } from "@/core/database/schemas"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get("channel")
    const status = searchParams.get("status")
    const theme = searchParams.get("theme")
    const boost = searchParams.get("boost")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

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

    const total = posts.length;
    let paginatedPosts = posts;

    if (limit && offset) {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      if (!isNaN(limitNum) && !isNaN(offsetNum) && limitNum >= 0 && offsetNum >= 0) {
        paginatedPosts = posts.slice(offsetNum, offsetNum + limitNum);
      }
    }
    const response: APIResponse<PostsResponse> = {
      success: true,
      data: { posts: paginatedPosts, total },
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

    // Validate data types
    if (typeof body.date !== "string") {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Invalid data type for field: date. Expected string.",
      }
      return NextResponse.json(response, { status: 400 })
    }
    if (typeof body.idea !== "string") {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Invalid data type for field: idea. Expected string.",
      }
      return NextResponse.json(response, { status: 400 })
    }
    if (typeof body.goal !== "string") {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Invalid data type for field: goal. Expected string.",
      }
      return NextResponse.json(response, { status: 400 })
    }
    if (typeof body.type !== "string") {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Invalid data type for field: type. Expected string.",
      }
      return NextResponse.json(response, { status: 400 })
    }
    if (!Array.isArray(body.channels) || !body.channels.every(channel => typeof channel === "string")) {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Invalid data type for field: channels. Expected array of strings.",
      }
      return NextResponse.json(response, { status: 400 })
    }
    if (body.boost !== undefined && typeof body.boost !== "boolean") {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Invalid data type for field: boost. Expected boolean.",
      }
      return NextResponse.json(response, { status: 400 })
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
