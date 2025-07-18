import { type NextRequest, NextResponse } from "next/server"
import { getPost, updatePost, deletePost } from "@/lib/kv"
import type { APIResponse, DBPost } from "@/lib/db-schema"

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
    const success = await deletePost(params.id)

    if (!success) {
      const response: APIResponse<null> = {
        success: false,
        error: "Post not found",
      }
      return NextResponse.json(response, { status: 404 })
    }

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
