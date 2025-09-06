import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Table, Badge, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { 
  UserGroup,
  User,
  CurrencyDollar,
  ShoppingBag,
  Calendar,
  MagnifyingGlass,
  ArrowPath,
  EnvelopeSolid,
  BuildingSolid
} from "@medusajs/icons"

const FabricCustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    newThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const fetchCustomers = async () => {
    try {
      setRefreshing(true)
      // Fetch from fabric-store API
      const fabricStoreUrl = process.env.NEXT_PUBLIC_FABRIC_STORE_URL || "http://localhost:3006"
      const response = await fetch(`${fabricStoreUrl}/api/customers`)
      const data = await response.json()
      
      setCustomers(data.customers || [])
      setStats(data.stats || stats)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch customers:", error)
      setLoading(false)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchCustomers, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredCustomers = customers.filter((customer) => {
    return (
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getCustomerStatus = (customer: any) => {
    if (!customer.lastOrderDate) return "new"
    
    const lastOrder = new Date(customer.lastOrderDate)
    const daysSinceLastOrder = Math.floor(
      (Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceLastOrder < 30) return "active"
    if (daysSinceLastOrder < 90) return "idle"
    return "inactive"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green"
      case "new":
        return "blue"
      case "idle":
        return "orange"
      case "inactive":
        return "red"
      default:
        return "grey"
    }
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h1">Fabric Store Customers</Heading>
            <Text className="text-ui-fg-subtle mt-2">
              View and manage customer information from the fabric store
            </Text>
          </div>
          <Button
            onClick={fetchCustomers}
            variant="secondary"
            disabled={refreshing}
          >
            <ArrowPath className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-ui-bg-base rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <UserGroup className="text-ui-fg-muted" />
              <Text className="font-semibold text-2xl">{stats.total}</Text>
            </div>
            <Text className="text-ui-fg-subtle text-sm">Total Customers</Text>
          </div>

          <div className="bg-ui-bg-base rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <User className="text-green-500" />
              <Text className="font-semibold text-2xl text-green-600">
                {stats.active}
              </Text>
            </div>
            <Text className="text-ui-fg-subtle text-sm">Active</Text>
          </div>

          <div className="bg-ui-bg-base rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-blue-500" />
              <Text className="font-semibold text-2xl text-blue-600">
                {stats.newThisMonth}
              </Text>
            </div>
            <Text className="text-ui-fg-subtle text-sm">New This Month</Text>
          </div>

          <div className="bg-ui-bg-base rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <CurrencyDollar className="text-green-500" />
              <Text className="font-semibold text-2xl text-green-600">
                ${((stats.totalRevenue || 0) / 100).toFixed(0)}
              </Text>
            </div>
            <Text className="text-ui-fg-subtle text-sm">Total Revenue</Text>
          </div>

          <div className="bg-ui-bg-base rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="text-purple-500" />
              <Text className="font-semibold text-2xl text-purple-600">
                ${((stats.averageOrderValue || 0) / 100).toFixed(0)}
              </Text>
            </div>
            <Text className="text-ui-fg-subtle text-sm">Avg Order Value</Text>
          </div>

          <div className="bg-ui-bg-base rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <User className="text-red-500" />
              <Text className="font-semibold text-2xl text-red-600">
                {stats.inactive}
              </Text>
            </div>
            <Text className="text-ui-fg-subtle text-sm">Inactive</Text>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            type="search"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Orders</Table.HeaderCell>
              <Table.HeaderCell>Total Spent</Table.HeaderCell>
              <Table.HeaderCell>Last Order</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <Table.Row 
                  key={customer.id}
                  className="cursor-pointer hover:bg-ui-bg-base-hover"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ui-bg-subtle flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <Text className="font-medium">
                          {customer.name || customer.email}
                        </Text>
                        {customer.name && customer.name !== customer.email && (
                          <Text className="text-ui-fg-subtle text-xs">
                            {customer.firstName} {customer.lastName}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <EnvelopeSolid className="w-4 h-4 text-ui-fg-muted" />
                      <Text className="text-sm">{customer.email}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {customer.address?.city ? (
                      <div className="flex items-center gap-2">
                        <BuildingSolid className="w-4 h-4 text-ui-fg-muted" />
                        <Text className="text-sm">
                          {customer.address.city}, {customer.address.state}
                        </Text>
                      </div>
                    ) : (
                      <Text className="text-ui-fg-subtle text-sm">—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-ui-fg-muted" />
                      <Text className="font-medium">{customer.totalOrders || 0}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-semibold">
                      ${((customer.totalSpent || 0) / 100).toFixed(2)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {customer.lastOrderDate ? (
                      <Text className="text-sm">
                        {new Date(customer.lastOrderDate).toLocaleDateString()}
                      </Text>
                    ) : (
                      <Text className="text-ui-fg-subtle text-sm">Never</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getStatusColor(getCustomerStatus(customer))}>
                      {getCustomerStatus(customer)}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-12">
                  <UserGroup className="mx-auto mb-4 text-ui-fg-muted" />
                  <Text className="text-ui-fg-subtle">No customers found</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div 
            className="bg-ui-bg-base rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <Heading level="h2">Customer Details</Heading>
                <Text className="text-ui-fg-subtle mt-1">{selectedCustomer.email}</Text>
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <Text className="font-semibold mb-3">Personal Information</Text>
                <div className="bg-ui-bg-subtle rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <Text className="text-ui-fg-subtle">Name</Text>
                    <Text>{selectedCustomer.name || '—'}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-ui-fg-subtle">Email</Text>
                    <Text>{selectedCustomer.email}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-ui-fg-subtle">Phone</Text>
                    <Text>{selectedCustomer.phone || '—'}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-ui-fg-subtle">Customer Since</Text>
                    <Text>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</Text>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedCustomer.address?.address && (
                <div>
                  <Text className="font-semibold mb-3">Shipping Address</Text>
                  <div className="bg-ui-bg-subtle rounded-lg p-4">
                    <Text>{selectedCustomer.address.address}</Text>
                    <Text>
                      {selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zipCode}
                    </Text>
                    <Text>{selectedCustomer.address.country}</Text>
                  </div>
                </div>
              )}

              {/* Order Statistics */}
              <div>
                <Text className="font-semibold mb-3">Order Statistics</Text>
                <div className="bg-ui-bg-subtle rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <Text className="text-ui-fg-subtle text-sm">Total Orders</Text>
                    <Text className="text-xl font-semibold">{selectedCustomer.totalOrders || 0}</Text>
                  </div>
                  <div>
                    <Text className="text-ui-fg-subtle text-sm">Total Spent</Text>
                    <Text className="text-xl font-semibold">
                      ${((selectedCustomer.totalSpent || 0) / 100).toFixed(2)}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-ui-fg-subtle text-sm">First Order</Text>
                    <Text className="text-sm">
                      {selectedCustomer.firstOrderDate 
                        ? new Date(selectedCustomer.firstOrderDate).toLocaleDateString()
                        : '—'}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-ui-fg-subtle text-sm">Last Order</Text>
                    <Text className="text-sm">
                      {selectedCustomer.lastOrderDate
                        ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString()
                        : '—'}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export default FabricCustomersPage

export const config = defineRouteConfig({
  label: "Fabric Customers",
  icon: UserGroup,
})