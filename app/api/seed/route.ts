import { NextResponse } from "next/server"
import {
  createPost,
  createHeroCategory,
  createLaunchItem,
  createPromoItem,
  createChannelStrategy,
  createSEOKeyword,
  createBlogPost,
  createCreativeGuideline,
} from "@/lib/kv"
import {
  seedPosts,
  seedHeroCategories,
  seedLaunchItems,
  seedPromoItems,
  seedChannelStrategies,
  seedSEOKeywords,
  seedBlogPosts,
  seedCreativeGuidelines,
} from "@/lib/seed-data"

export async function POST() {
  try {
    // Seed all data in parallel
    await Promise.all([
      // Posts
      ...seedPosts.map((post) => createPost(post)),

      // Hero Categories
      ...seedHeroCategories.map((category) => createHeroCategory(category)),

      // Launch Items
      ...seedLaunchItems.map((item) => createLaunchItem(item)),

      // Promo Items
      ...seedPromoItems.map((item) => createPromoItem(item)),

      // Channel Strategies
      ...seedChannelStrategies.map((strategy) => createChannelStrategy(strategy)),

      // SEO Keywords
      ...seedSEOKeywords.map((keyword) => createSEOKeyword(keyword)),

      // Blog Posts
      ...seedBlogPosts.map((post) => createBlogPost(post)),

      // Creative Guidelines
      ...seedCreativeGuidelines.map((guideline) => createCreativeGuideline(guideline)),
    ])

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ success: false, error: "Failed to seed database" }, { status: 500 })
  }
}
