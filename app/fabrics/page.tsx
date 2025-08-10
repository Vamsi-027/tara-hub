import { Suspense } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FabricsListingPage } from "@/components/fabrics-listing-page"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getAllFabrics, getFabricFilters, initializeFabrics } from "@/lib/fabric-kv"
import { Metadata } from "next"

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

// Generate metadata for SEO
export const metadata: Metadata = {
  title: "Premium Fabric Collection",
  description: "Browse our extensive collection of premium fabrics for custom cushions and pillows. Over 100 fabrics to choose from, all made in the USA.",
}

// Server component to fetch data
async function getFabricData() {
  // Initialize fabrics from seed data if needed
  await initializeFabrics()
  
  // Fetch all data in parallel
  const [fabrics, filters] = await Promise.all([
    getAllFabrics(),
    getFabricFilters()
  ])
  
  return { fabrics, filters }
}

export default async function FabricsPage() {
  const { fabrics, filters } = await getFabricData()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Fabric Collection</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading fabrics...</div>}>
          <FabricsListingPage 
            initialFabrics={fabrics}
            initialFilters={filters}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}