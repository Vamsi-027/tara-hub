import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Badge, Button } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { ArrowRight, ShoppingBag } from "@medusajs/icons"

const OrdersListPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      // Fetch orders from your API
      const response = await fetch("/admin/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "orange"
      case "processing": return "blue"
      case "shipped": return "purple"
      case "completed": return "green"
      case "cancelled": return "red"
      default: return "grey"
    }
  }

  const handleOrderClick = (orderId: string) => {
    // Navigate to the detail page
    navigate(`/app/orders/${orderId}`)
  }

  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-base"></div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            <Heading level="h1">Orders</Heading>
          </div>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Order ID</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Total</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {orders.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center text-ui-fg-muted">
                No orders found
              </Table.Cell>
            </Table.Row>
          ) : (
            orders.map((order) => (
              <Table.Row
                key={order.id}
                className="cursor-pointer hover:bg-ui-bg-subtle"
                onClick={() => handleOrderClick(order.id)}
              >
                <Table.Cell className="font-medium">
                  {order.display_id || order.id}
                </Table.Cell>
                <Table.Cell>
                  {new Date(order.created_at).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell>
                  {order.email || order.customer?.email || "N/A"}
                </Table.Cell>
                <Table.Cell>
                  ${((order.total || 0) / 100).toFixed(2)}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={getStatusColor(order.status || "pending")}>
                    {order.status || "pending"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOrderClick(order.id)
                    }}
                  >
                    View <ArrowRight className="ml-1" />
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}

export default OrdersListPage

// This config will add the page to the sidebar
export const config = defineRouteConfig({
  label: "Orders",
  icon: ShoppingBag,
})