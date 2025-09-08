import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.params.id
  
  // Check if this is a fabric customer
  if (customerId?.startsWith('cust_')) {
    try {
      // Get fabric customers from global store
      const fabricCustomers = global.fabricStoreData?.customers || []
      const fabricCustomer = fabricCustomers.find((c: any) => c.id === customerId)
      
      if (fabricCustomer) {
        // Get customer's orders
        const fabricOrders = global.fabricStoreData?.orders || []
        const customerOrders = fabricOrders.filter((order: any) => order.email === fabricCustomer.email)
        
        // Transform to full Medusa customer format with orders
        const transformedCustomer = {
          id: fabricCustomer.id,
          email: fabricCustomer.email,
          first_name: fabricCustomer.firstName || fabricCustomer.name?.split(' ')[0] || '',
          last_name: fabricCustomer.lastName || fabricCustomer.name?.split(' ')[1] || '',
          phone: fabricCustomer.phone,
          created_at: fabricCustomer.createdAt,
          updated_at: fabricCustomer.updatedAt || fabricCustomer.createdAt,
          has_account: true,
          groups: [],
          addresses: fabricCustomer.address ? [{
            id: `addr_${fabricCustomer.id}`,
            first_name: fabricCustomer.firstName || '',
            last_name: fabricCustomer.lastName || '',
            address_1: fabricCustomer.address.address || '',
            address_2: '',
            city: fabricCustomer.address.city || '',
            province: fabricCustomer.address.state || '',
            postal_code: fabricCustomer.address.zipCode || '',
            country_code: fabricCustomer.address.country?.toLowerCase() || 'us',
            phone: fabricCustomer.phone || '',
            company: '',
            metadata: {}
          }] : [],
          shipping_addresses: fabricCustomer.address ? [{
            id: `ship_addr_${fabricCustomer.id}`,
            first_name: fabricCustomer.firstName || '',
            last_name: fabricCustomer.lastName || '',
            address_1: fabricCustomer.address.address || '',
            address_2: '',
            city: fabricCustomer.address.city || '',
            province: fabricCustomer.address.state || '',
            postal_code: fabricCustomer.address.zipCode || '',
            country_code: fabricCustomer.address.country?.toLowerCase() || 'us',
            phone: fabricCustomer.phone || '',
            company: '',
            metadata: {}
          }] : [],
          orders: customerOrders.map((order: any) => ({
            id: order.id,
            display_id: parseInt(order.id.split('_')[1]) || 9999,
            status: order.status || "pending",
            email: order.email,
            created_at: order.createdAt,
            payment_status: order.status === "completed" ? "captured" : "awaiting",
            fulfillment_status: order.status === "completed" ? "fulfilled" : "not_fulfilled",
            total: order.totals?.total || 0,
            currency_code: "usd",
            items: (order.items || []).map((item: any) => ({
              title: item.title,
              quantity: item.quantity,
              unit_price: item.price,
              subtotal: item.price * item.quantity
            }))
          })),
          metadata: {
            source: "fabric-store",
            total_orders: fabricCustomer.totalOrders || customerOrders.length,
            total_spent: fabricCustomer.totalSpent || 0,
            last_order_date: fabricCustomer.lastOrderDate,
            average_order_value: fabricCustomer.totalOrders > 0 
              ? (fabricCustomer.totalSpent / fabricCustomer.totalOrders) 
              : 0,
            notes: fabricCustomer.notes || [],
            tags: fabricCustomer.tags || [],
            status: fabricCustomer.status || 'active'
          }
        }
        
        return res.json({ customer: transformedCustomer })
      }
    } catch (error) {
      console.error('Error fetching fabric customer:', error)
    }
  }
  
  // If not a fabric customer, return 404 to let Medusa handle it
  return res.status(404).json({ message: "Customer not found" })
}