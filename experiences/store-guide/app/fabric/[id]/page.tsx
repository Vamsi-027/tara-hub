import { fabricSeedData, getFabricById } from "@/lib/fabric-seed-data"
import { FabricDetailPage } from "@/components/fabric-detail-page"
import { notFound } from "next/navigation"

interface FabricPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FabricPage({ params }: FabricPageProps) {
  const resolvedParams = await params
  const fabric = getFabricById(resolvedParams.id)
  
  if (!fabric) {
    notFound()
  }

  return <FabricDetailPage fabric={fabric} />
}

export async function generateStaticParams() {
  return fabricSeedData.map((fabric) => ({
    id: fabric.id,
  }))
}