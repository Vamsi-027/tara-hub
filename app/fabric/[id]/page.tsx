import { FabricDetailPage } from "@/components/fabric-detail-page"
import { getFabric, getAllFabrics, initializeFabrics } from "@/lib/fabric-kv"
import { notFound } from "next/navigation"
import { Metadata } from "next"

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

interface FabricPageProps {
  params: {
    id: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: FabricPageProps): Promise<Metadata> {
  const fabric = await getFabric(params.id)
  
  if (!fabric) {
    return {
      title: 'Fabric Not Found',
    }
  }

  return {
    title: `${fabric.name} - Premium Fabric`,
    description: fabric.description,
    openGraph: {
      title: fabric.name,
      description: fabric.description,
      images: fabric.swatchImageUrl ? [fabric.swatchImageUrl] : [],
    },
  }
}

export default async function FabricPage({ params }: FabricPageProps) {
  // Initialize fabrics if needed
  await initializeFabrics()
  
  const fabric = await getFabric(params.id)
  
  if (!fabric) {
    notFound()
  }

  return <FabricDetailPage fabric={fabric} />
}

// Generate static paths for all fabrics
export async function generateStaticParams() {
  // Initialize fabrics from seed data
  await initializeFabrics()
  
  // Get all fabrics
  const fabrics = await getAllFabrics()
  
  return fabrics.map((fabric) => ({
    id: fabric.id,
  }))
}