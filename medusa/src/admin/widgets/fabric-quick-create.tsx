import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Button } from "@medusajs/ui"
import { Plus } from "@medusajs/icons"
import { useNavigate } from "react-router-dom"

const FabricQuickCreate = () => {
  const navigate = useNavigate()

  return (
    <Container className="bg-ui-bg-base">
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="text-sm font-semibold">Fabric Products</h3>
          <p className="text-xs text-ui-fg-subtle mt-1">
            Create fabric products with detailed specifications
          </p>
        </div>
        <Button
          size="small"
          onClick={() => navigate('/products/create')}
        >
          <Plus className="mr-2" />
          Create Fabric
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default FabricQuickCreate