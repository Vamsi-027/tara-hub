export default function StoreLayout({
  children,
}: {
 children: React.ReactNode
}) {
  // Structured data moved to root layout head
  return <>{children}</>
}
