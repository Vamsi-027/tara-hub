import { StructuredData } from "@/components/structured-data"

export default function StoreLayout({
  children,
}: {
 children: React.ReactNode
}) {
  return (
    <>
      <StructuredData />
      {children}
    </>
  )
}
