"use client"

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

function FabricsContent() {
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
        <FabricsListingPage />
      </main>
      <Footer />
    </div>
  )
}

export default function FabricsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FabricsContent />
    </Suspense>
  )
}