import { type NextRequest, NextResponse } from "next/server"
import { getPost, updatePost, deletePost } from "@/core/cache/providers/vercel-kv"
import type { APIResponse, DBPost } from "@/core/database/schemas"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await getPost(params.id)

    if (!post) {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Post not found",
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: APIResponse<DBPost> = {
      success: true,
      data: post,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching post:", error)
    const response: APIResponse<DBPost> = {
      success: false,
      error: "Failed to fetch post",
    }
    return NextResponse.json(response, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const updatedPost = await updatePost(params.id, body)

    if (!updatedPost) {
      const response: APIResponse<DBPost> = {
        success: false,
        error: "Post not found",
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: APIResponse<DBPost> = {
      success: true,
      data: updatedPost,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error updating post:", error)
    const response: APIResponse<DBPost> = {
      success: false,
      error: "Failed to update post",
    }
    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if post exists first
    const post = await getPost(params.id)
    if (!post) {
      const response: APIResponse<null> = {
        success: false,
        error: "Post not found",
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Delete the post
    await deletePost(params.id)

    const response: APIResponse<null> = {
      success: true,
      data: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error deleting post:", error)
    const response: APIResponse<null> = {
      success: false,
      error: "Failed to delete post",
    }
    return NextResponse.json(response, { status: 500 })
  }
}
