import { NextResponse } from "next/server"
import { getAllHeroCategories, getAllLaunchItems, getAllPromoItems } from "@/core/cache/providers/vercel-kv"
import type { APIResponse, ProductsResponse } from "@/core/database/schemas"

export async function GET() {
  try {
    const [heroCategories, launchPipeline, promoFramework] = await Promise.all([
      getAllHeroCategories(),
      getAllLaunchItems(),
      getAllPromoItems(),
    ])

    const response: APIResponse<ProductsResponse> = {
      success: true,
      data: {
        heroCategories,
        launchPipeline,
        promoFramework,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching products data:", error)
    const response: APIResponse<ProductsResponse> = {
      success: false,
      error: "Failed to fetch products data",
    }
    return NextResponse.json(response, { status: 500 })
  }
}
