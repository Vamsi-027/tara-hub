import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { ShoppingBag } from "@medusajs/icons"

const FabricOrdersTestPage = () => {
  return (
    <Container>
      <Heading level="h1">Fabric Orders Test</Heading>
      <Text>This is a test page to verify Medusa custom routes are working.</Text>
      <Text className="mt-4">If you can see this text, the custom route is working!</Text>
    </Container>
  )
}

export default FabricOrdersTestPage

export const config = defineRouteConfig({
  label: "Fabric Orders Test",
  icon: ShoppingBag,
})