import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, Tabs } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  ArrowLeft,
  Calendar,
  CurrencyDollar,
  User,
  MapPin,
  Envelope,
  Phone,
  ShoppingBag,
  CheckCircle,
  Clock,
  XMarkMini
} from "@medusajs/icons"

const OrderDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchOrderDetail()
  }, [id])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      
      // Check if it's a fabric order
      if (id?.startsWith('order_')) {
        const response = await fetch(`/admin/fabric-orders/${id}`)
        const data = await response.json()
        setOrder(data.order)
      } else {
        // Regular Medusa order - implement if needed
        setOrder(null)
      }
    } catch (error) {
      console.error("Failed to fetch order:", error)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock />
      case "processing": return <ShoppingBag />
      case "completed": return <CheckCircle />
      case "cancelled": return <XMarkMini />
      default: return <ShoppingBag />
    }
  }

  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-base"></div>
      </Container>
    )
  }

  if (!order) {
    return (
      <Container>
        <Button 
          variant="transparent" 
          onClick={() => navigate("/app/orders")}
          className="mb-4"
        >
          <ArrowLeft /> Back to Orders
        </Button>
        <Text>Order not found</Text>
      </Container>
    )
  }

  return (
    <Container>
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="transparent" 
          onClick={() => navigate("/app/orders")}
          className="mb-4"
        >
          <ArrowLeft /> Back to Orders
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <Heading level="h1">Order {order.display_id || order.id}</Heading>
            <div className="flex items-center gap-4 mt-2">
              <Badge color={getStatusColor(order.status)} className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {order.status}
              </Badge>
              <Text className="text-ui-fg-subtle flex items-center">
                <Calendar className="inline w-4 h-4 mr-1" />
                {new Date(order.created_at).toLocaleString()}
              </Text>
            </div>
          </div>
          <div className="text-right">
            <Text className="text-ui-fg-subtle text-sm">Total Amount</Text>
            <Text className="text-2xl font-bold">
              ${(order.total / 100).toFixed(2)} {order.currency_code?.toUpperCase()}
            </Text>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="customer">Customer</Tabs.Trigger>
          <Tabs.Trigger value="payment">Payment</Tabs.Trigger>
          <Tabs.Trigger value="fulfillment">Fulfillment</Tabs.Trigger>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Content value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Order Items */}
            <div className="bg-ui-bg-base rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <ShoppingBag className="mr-2" />
                <Text className="font-semibold text-lg">Order Items</Text>
              </div>
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <Text className="font-medium">{item.title}</Text>
                      {item.description && (
                        <Text className="text-ui-fg-subtle text-sm">{item.description}</Text>
                      )}
                      <Text className="text-ui-fg-subtle text-sm mt-1">
                        Quantity: {item.quantity} × ${(item.unit_price / 100).toFixed(2)}
                      </Text>
                    </div>
                    <Text className="font-semibold">
                      ${(item.total / 100).toFixed(2)}
                    </Text>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-ui-bg-base rounded-lg border p-6">
              <div className="flex items-center mb-4">
                <CurrencyDollar className="mr-2" />
                <Text className="font-semibold text-lg">Payment Summary</Text>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text className="text-ui-fg-subtle">Subtotal</Text>
                  <Text>${((order.subtotal || order.summary?.subtotal || 0) / 100).toFixed(2)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text className="text-ui-fg-subtle">Shipping</Text>
                  <Text>${((order.shipping_total || order.summary?.shipping_total || 0) / 100).toFixed(2)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text className="text-ui-fg-subtle">Tax</Text>
                  <Text>${((order.tax_total || order.summary?.tax_total || 0) / 100).toFixed(2)}</Text>
                </div>
                <div className="flex justify-between pt-3 border-t font-semibold">
                  <Text>Total</Text>
                  <Text className="text-lg">${(order.total / 100).toFixed(2)}</Text>
                </div>
              </div>
            </div>
          </div>
        </Tabs.Content>

        {/* Customer Tab */}
        <Tabs.Content value="customer">
          <div className="mt-6">
            <div className="bg-ui-bg-base rounded-lg border p-6">
              <div className="flex items-center mb-6">
                <User className="mr-2" />
                <Text className="font-semibold text-lg">Customer Information</Text>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Text className="text-ui-fg-subtle text-sm mb-2">Contact Information</Text>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Envelope className="w-4 h-4 mr-2 text-ui-fg-subtle" />
                      <Text>{order.email || order.customer?.email}</Text>
                    </div>
                    {order.customer?.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-ui-fg-subtle" />
                        <Text>{order.customer.phone}</Text>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Text className="text-ui-fg-subtle text-sm mb-2">Customer Name</Text>
                  <Text className="font-medium">
                    {order.customer?.first_name} {order.customer?.last_name}
                  </Text>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center mb-4">
                    <MapPin className="mr-2" />
                    <Text className="font-semibold">Shipping Address</Text>
                  </div>
                  <div className="space-y-1">
                    <Text>{order.shipping_address.first_name} {order.shipping_address.last_name}</Text>
                    <Text>{order.shipping_address.address_1}</Text>
                    {order.shipping_address.address_2 && <Text>{order.shipping_address.address_2}</Text>}
                    <Text>
                      {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
                    </Text>
                    <Text className="uppercase">{order.shipping_address.country_code}</Text>
                  </div>
                </div>
              )}

              {/* Billing Address */}
              {order.billing_address && (
                <div className="mt-6 pt-6 border-t">
                  <Text className="font-semibold mb-4">Billing Address</Text>
                  <div className="space-y-1">
                    <Text>{order.billing_address.first_name} {order.billing_address.last_name}</Text>
                    <Text>{order.billing_address.address_1}</Text>
                    {order.billing_address.address_2 && <Text>{order.billing_address.address_2}</Text>}
                    <Text>
                      {order.billing_address.city}, {order.billing_address.province} {order.billing_address.postal_code}
                    </Text>
                    <Text className="uppercase">{order.billing_address.country_code}</Text>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* Payment Tab */}
        <Tabs.Content value="payment">
          <div className="mt-6">
            <div className="bg-ui-bg-base rounded-lg border p-6">
              <Text className="font-semibold text-lg mb-4">Payment Information</Text>
              
              {order.payment_collections?.map((collection: any, index: number) => (
                <div key={index} className="space-y-4">
                  <div className="flex justify-between">
                    <Text className="text-ui-fg-subtle">Payment Status</Text>
                    <Badge color={collection.status === "authorized" ? "green" : "orange"}>
                      {collection.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-ui-fg-subtle">Amount</Text>
                    <Text>${(collection.amount / 100).toFixed(2)}</Text>
                  </div>
                  
                  {collection.payments?.map((payment: any, pIndex: number) => (
                    <div key={pIndex} className="pt-4 border-t">
                      <Text className="text-ui-fg-subtle text-sm mb-2">Payment Method</Text>
                      <Text className="font-mono text-sm">{payment.provider_id}</Text>
                      {payment.data?.payment_intent_id && (
                        <>
                          <Text className="text-ui-fg-subtle text-sm mt-2">Payment Intent</Text>
                          <Text className="font-mono text-xs">{payment.data.payment_intent_id}</Text>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {order.metadata?.payment_intent_id && (
                <div className="mt-4 pt-4 border-t">
                  <Text className="text-ui-fg-subtle text-sm">Payment Intent ID</Text>
                  <Text className="font-mono text-xs">{order.metadata.payment_intent_id}</Text>
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* Fulfillment Tab */}
        <Tabs.Content value="fulfillment">
          <div className="mt-6">
            <div className="bg-ui-bg-base rounded-lg border p-6">
              <Text className="font-semibold text-lg mb-4">Fulfillment Information</Text>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Text className="text-ui-fg-subtle">Fulfillment Status</Text>
                  <Badge color={order.fulfillment_status === "fulfilled" ? "green" : "orange"}>
                    {order.fulfillment_status}
                  </Badge>
                </div>
                
                {order.shipping_methods?.map((method: any, index: number) => (
                  <div key={index} className="pt-4 border-t">
                    <Text className="font-medium">{method.name || method.shipping_option?.name}</Text>
                    <Text className="text-ui-fg-subtle text-sm">
                      Shipping Cost: ${(method.price / 100).toFixed(2)}
                    </Text>
                  </div>
                ))}
                
                {order.timeline && order.timeline.length > 0 && (
                  <div className="pt-4 border-t">
                    <Text className="font-medium mb-3">Order Timeline</Text>
                    <div className="space-y-3">
                      {order.timeline.map((event: any, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-ui-fg-base mt-1.5 mr-3"></div>
                          <div className="flex-1">
                            <Text className="text-sm">{event.message}</Text>
                            <Text className="text-ui-fg-subtle text-xs">
                              {new Date(event.timestamp).toLocaleString()}
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs>
    </Container>
  )
}

export default OrderDetailPage

// Don't export config to prevent this from appearing in the sidebar
// This page should only be accessible via navigation from the orders list