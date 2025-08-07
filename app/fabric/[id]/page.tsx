import { fabricSeedData } from "@/lib/fabric-seed-data"
import { FabricDetailPage } from "@/components/fabric-detail-page"
import { notFound } from "next/navigation"

interface FabricPageProps {
  params: {
    id: string
  }
}

export default function FabricPage({ params }: FabricPageProps) {
  const fabric = fabricSeedData.find(f => f.id === params.id)
  
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
