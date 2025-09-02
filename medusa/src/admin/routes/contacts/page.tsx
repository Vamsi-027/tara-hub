import { defineRouteConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Button, 
  Input, 
  Label, 
  Badge, 
  Text,
  Table,
  Select,
  Textarea,
  toast,
  Toaster,
  Tooltip
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import { 
  ChatBubbleLeftRight, 
  MagnifyingGlass, 
  Adjustments,
  ExclamationCircle,
  ClockSolid,
  CheckCircleSolid,
  XCircleSolid,
  Phone,
  Envelope
} from "@medusajs/icons"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  order_number?: string
  status: "new" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  source: string
  admin_notes?: string
  created_at: string
  updated_at: string
  responded_at?: string
}

interface ContactStats {
  total: number
  new: number
  in_progress: number
  resolved: number
  urgent: number
  today: number
  this_week: number
  this_month: number
  response_rate: number
}

const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 20

  // Load contacts and stats
  useEffect(() => {
    loadContacts()
    loadStats()
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, sourceFilter, searchQuery])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        offset: (currentPage * limit).toString(),
        limit: limit.toString()
      })

      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (sourceFilter !== "all") params.append("source", sourceFilter)
      if (searchQuery) params.append("q", searchQuery)

      const response = await fetch(`/admin/contact?${params}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts)
        setTotalCount(data.count)
      }
    } catch (error) {
      toast.error("Failed to load contacts")
      console.error("Error loading contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/admin/contact/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const updateContactStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const response = await fetch(`/admin/contact/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          admin_notes: adminNotes 
        })
      })

      if (response.ok) {
        toast.success("Contact updated successfully")
        loadContacts()
        loadStats()
        setSelectedContact(null)
      } else {
        toast.error("Failed to update contact")
      }
    } catch (error) {
      toast.error("Failed to update contact")
      console.error("Error updating contact:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      new: "orange",
      in_progress: "blue", 
      resolved: "green",
      closed: "grey"
    } as const

    const icons = {
      new: <ExclamationCircle className="w-3 h-3" />,
      in_progress: <ClockSolid className="w-3 h-3" />,
      resolved: <CheckCircleSolid className="w-3 h-3" />,
      closed: <XCircleSolid className="w-3 h-3" />
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="flex items-center gap-1">
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "grey",
      medium: "blue",
      high: "orange", 
      urgent: "red"
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants]}>
        {priority}
      </Badge>
    )
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setPriorityFilter("all") 
    setCategoryFilter("all")
    setSourceFilter("all")
    setSearchQuery("")
    setCurrentPage(0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getResponseTime = (createdAt: string, respondedAt?: string) => {
    if (!respondedAt) return "No response yet"
    
    const created = new Date(createdAt)
    const responded = new Date(respondedAt)
    const diffHours = Math.floor((responded.getTime() - created.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return "< 1 hour"
    if (diffHours < 24) return `${diffHours} hours`
    return `${Math.floor(diffHours / 24)} days`
  }

  return (
    <Container className="divide-y">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <Heading level="h1" className="flex items-center gap-3">
            <ChatBubbleLeftRight />
            Contact Management
          </Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage customer inquiries and support requests
          </Text>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
              <div className="pb-2">
                <Text className="text-sm text-ui-fg-subtle">Total Contacts</Text>
              </div>
              <div>
                <Text className="text-2xl font-semibold">{stats.total}</Text>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
              <div className="pb-2">
                <Text className="text-sm text-ui-fg-subtle">New / Unresponded</Text>
              </div>
              <div>
                <Text className="text-2xl font-semibold text-orange-600">{stats.new}</Text>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
              <div className="pb-2">
                <Text className="text-sm text-ui-fg-subtle">Urgent Priority</Text>
              </div>
              <div>
                <Text className="text-2xl font-semibold text-red-600">{stats.urgent}</Text>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
              <div className="pb-2">
                <Text className="text-sm text-ui-fg-subtle">Response Rate</Text>
              </div>
              <div>
                <Text className="text-2xl font-semibold text-green-600">
                  {Math.round(stats.response_rate)}%
                </Text>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
              <div className="pb-2">
                <Text className="text-sm text-ui-fg-subtle">Today</Text>
              </div>
              <div>
                <Text className="text-lg font-medium">{stats.today}</Text>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
              <div className="pb-2">
                <Text className="text-sm text-ui-fg-subtle">This Week</Text>
              </div>
              <div>
                <Text className="text-lg font-medium">{stats.this_week}</Text>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-4">
              <div className="pb-2">
                <Text className="text-sm text-ui-fg-subtle">This Month</Text>
              </div>
              <div>
                <Text className="text-lg font-medium">{stats.this_month}</Text>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="px-8 py-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ui-fg-subtle w-4 h-4" />
              <Input
                placeholder="Search contacts by name, email, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Adjustments />
            Filters
          </Button>
          {(statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || sourceFilter !== "all" || searchQuery) && (
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-ui-bg-subtle rounded-lg">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Statuses</Select.Item>
                  <Select.Item value="new">New</Select.Item>
                  <Select.Item value="in_progress">In Progress</Select.Item>
                  <Select.Item value="resolved">Resolved</Select.Item>
                  <Select.Item value="closed">Closed</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Priorities</Select.Item>
                  <Select.Item value="urgent">Urgent</Select.Item>
                  <Select.Item value="high">High</Select.Item>
                  <Select.Item value="medium">Medium</Select.Item>
                  <Select.Item value="low">Low</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Categories</Select.Item>
                  <Select.Item value="fabric_inquiry">Fabric Inquiry</Select.Item>
                  <Select.Item value="order_support">Order Support</Select.Item>
                  <Select.Item value="returns">Returns</Select.Item>
                  <Select.Item value="technical">Technical</Select.Item>
                  <Select.Item value="general">General</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div>
              <Label>Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Sources</Select.Item>
                  <Select.Item value="fabric_store">Fabric Store</Select.Item>
                  <Select.Item value="admin">Admin Portal</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="px-8 pb-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Text>Loading contacts...</Text>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8">
            <Text className="text-ui-fg-subtle">No contacts found</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Priority</Table.HeaderCell>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Source</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
                <Table.HeaderCell>Response Time</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {contacts.map((contact) => (
                <Table.Row key={contact.id} className="cursor-pointer hover:bg-ui-bg-subtle">
                  <Table.Cell>
                    <div>
                      <Text className="font-medium">{contact.name}</Text>
                      <div className="flex items-center gap-2 mt-1">
                        <Envelope className="w-3 h-3 text-ui-fg-subtle" />
                        <Text className="text-sm text-ui-fg-subtle">{contact.email}</Text>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-ui-fg-subtle" />
                          <Text className="text-sm text-ui-fg-subtle">{contact.phone}</Text>
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <Text className="font-medium">{contact.subject}</Text>
                      {contact.order_number && (
                        <Text className="text-sm text-ui-fg-subtle">Order: {contact.order_number}</Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(contact.status)}
                  </Table.Cell>
                  <Table.Cell>
                    {getPriorityBadge(contact.priority)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="grey">
                      {contact.category?.replace('_', ' ') || 'general'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-sm capitalize">
                      {contact.source?.replace('_', ' ') || 'unknown'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-sm">
                      {formatDate(contact.created_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-sm">
                      {getResponseTime(contact.created_at, contact.responded_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setSelectedContact(contact)}
                    >
                      View
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        {/* Pagination */}
        {totalCount > limit && (
          <div className="flex justify-between items-center mt-6">
            <Text className="text-sm text-ui-fg-subtle">
              Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, totalCount)} of {totalCount} contacts
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={(currentPage + 1) * limit >= totalCount}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <Heading level="h2">{selectedContact.name}</Heading>
                  <Text className="text-ui-fg-subtle">{selectedContact.email}</Text>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedContact(null)}
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject</Label>
                  <Text className="font-medium">{selectedContact.subject}</Text>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Text>{selectedContact.phone || "Not provided"}</Text>
                </div>
                <div>
                  <Label>Order Number</Label>
                  <Text>{selectedContact.order_number || "Not provided"}</Text>
                </div>
                <div>
                  <Label>Category</Label>
                  <Text className="capitalize">{selectedContact.category?.replace('_', ' ') || 'general'}</Text>
                </div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedContact.status)}
                  </div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedContact.priority)}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label>Message</Label>
                <div className="mt-1 p-4 bg-ui-bg-subtle rounded border">
                  <Text>{selectedContact.message}</Text>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  placeholder="Add internal notes about this contact..."
                  rows={3}
                  defaultValue={selectedContact.admin_notes || ""}
                  id={`notes-${selectedContact.id}`}
                />
              </div>

              {/* Timestamps */}
              <div className="text-sm text-ui-fg-subtle">
                <Text>Created: {formatDate(selectedContact.created_at)}</Text>
                {selectedContact.responded_at && (
                  <Text>Responded: {formatDate(selectedContact.responded_at)}</Text>
                )}
                <Text>Last Updated: {formatDate(selectedContact.updated_at)}</Text>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    const notes = (document.getElementById(`notes-${selectedContact.id}`) as HTMLTextAreaElement)?.value
                    updateContactStatus(selectedContact.id, "in_progress", notes)
                  }}
                  disabled={selectedContact.status === "in_progress"}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const notes = (document.getElementById(`notes-${selectedContact.id}`) as HTMLTextAreaElement)?.value
                    updateContactStatus(selectedContact.id, "resolved", notes)
                  }}
                  disabled={selectedContact.status === "resolved"}
                >
                  Mark Resolved
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const notes = (document.getElementById(`notes-${selectedContact.id}`) as HTMLTextAreaElement)?.value
                    updateContactStatus(selectedContact.id, "closed", notes)
                  }}
                  disabled={selectedContact.status === "closed"}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Contacts",
  icon: ChatBubbleLeftRight,
})

export default ContactManagement