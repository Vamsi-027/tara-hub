import { fabricSeedData } from "@/lib/fabric-seed-data"
import { FabricDetailPage } from "@/components/fabric-detail-page"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FabricDetailPage fabric={fabric} />
      <Footer />
    </div>
  )
}
