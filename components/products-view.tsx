"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProducts } from "@/hooks/use-products"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

export function ProductsView() {
  const { data, loading, error } = useProducts()

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Products, Promos & Launches</h1>
          <p className="text-destructive">Error loading products data: {error}</p>
        </div>
      </div>
    )
  }

  // Check if data is empty
  const isEmpty = !loading && (!data || (
    (!data.heroCategories || data.heroCategories.length === 0) &&
    (!data.launchPipeline || data.launchPipeline.length === 0) &&
    (!data.promoFramework || data.promoFramework.length === 0)
  ))

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Products, Promos & Launches</h1>
          <p className="text-muted-foreground">
            This section details the merchandising strategy for August, including the hero product categories to focus on,
            the pipeline for new collection launches, and the promotional framework designed to drive sales.
          </p>
        </div>
        
        <EmptyState 
          type="products"
          onAction={() => {
            // This could trigger a modal or navigation to a setup page
            console.log("Create product strategy clicked")
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products, Promos & Launches</h1>
        <p className="text-muted-foreground">
          This section details the merchandising strategy for August, including the hero product categories to focus on,
          the pipeline for new collection launches, and the promotional framework designed to drive sales.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Hero Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {data?.heroCategories.map((category) => (
                  <li key={category.id} className="text-sm list-disc list-inside text-muted-foreground">
                    {category.text}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Launch Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Launch Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.launchPipeline.map((launch) => (
                  <div key={launch.id} className="flex items-start gap-4">
                    <div className="bg-rose-100 text-rose-700 font-medium p-2 rounded-md text-center text-xs min-w-[60px] dark:bg-rose-900 dark:text-rose-300">
                      {launch.date.replace(" ", "\n")}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{launch.title}</p>
                      <p className="text-xs text-muted-foreground">{launch.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promotional Framework */}
        <Card>
          <CardHeader>
            <CardTitle>Promotional Framework</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.promoFramework.map((promo) => (
                  <div key={promo.id} className="space-y-1">
                    <p className="font-medium text-sm">
                      {promo.title} <span className="text-xs font-normal text-muted-foreground">({promo.dates})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{promo.details}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
