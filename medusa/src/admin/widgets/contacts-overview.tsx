import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { 
  Container,
  Heading,
  Text,
  Badge,
  Button
} from "@medusajs/ui"
import { 
  ChatBubbleLeftRight,
  ExclamationCircle,
  Clock,
  ArrowUpRightOnBox
} from "@medusajs/icons"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

interface ContactStats {
  total: number
  new: number
  in_progress: number
  resolved: number
  urgent: number
  today: number
  this_week: number
  response_rate: number
}

interface RecentContact {
  id: string
  name: string
  email: string
  subject: string
  status: string
  priority: string
  created_at: string
}

const ContactsOverviewWidget = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load stats
      const statsResponse = await fetch("/admin/contacts/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load recent contacts
      const contactsResponse = await fetch("/admin/contacts?limit=5&order_by=created_at&sort=desc")
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        setRecentContacts(contactsData.contacts)
      }
    } catch (error) {
      console.error("Error loading contact data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      new: "orange",
      in_progress: "blue", 
      resolved: "green",
      closed: "grey"
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants]} size="small">
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "text-gray-500",
      medium: "text-blue-600",
      high: "text-orange-600",
      urgent: "text-red-600"
    }
    return colors[priority as keyof typeof colors] || "text-gray-500"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChatBubbleLeftRight />
          <Heading level="h3">Customer Contacts</Heading>
        </div>
        <Text>Loading...</Text>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRight />
          <Heading level="h3">Customer Contacts</Heading>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => navigate("/contacts")}
          className="flex items-center gap-1"
        >
          View All
          <ArrowUpRightOnBox className="w-3 h-3" />
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-ui-bg-base rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm text-ui-fg-subtle">New</Text>
                <Text className="text-lg font-semibold text-orange-600">{stats.new}</Text>
              </div>
              <ExclamationCircle className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="p-4 bg-ui-bg-base rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm text-ui-fg-subtle">In Progress</Text>
                <Text className="text-lg font-semibold text-blue-600">{stats.in_progress}</Text>
              </div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          <div className="p-4 bg-ui-bg-base rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm text-ui-fg-subtle">Today</Text>
                <Text className="text-lg font-semibold">{stats.today}</Text>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>

          <div className="p-4 bg-ui-bg-base rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-sm text-ui-fg-subtle">Response Rate</Text>
                <Text className="text-lg font-semibold text-green-600">
                  {Math.round(stats.response_rate)}%
                </Text>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Contacts */}
      <div>
        <Heading level="h4" className="mb-3">Recent Inquiries</Heading>
        {recentContacts.length === 0 ? (
          <div className="p-6 text-center bg-ui-bg-base rounded-lg border border-ui-border-base">
            <Text className="text-ui-fg-subtle">No recent contacts</Text>
          </div>
        ) : (
          <div className="space-y-3">
            {recentContacts.map((contact) => (
              <div key={contact.id} className="p-4 bg-ui-bg-base rounded-lg border border-ui-border-base">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Text className="font-medium truncate">{contact.name}</Text>
                      <Text className={`text-xs font-medium uppercase ${getPriorityColor(contact.priority)}`}>
                        {contact.priority}
                      </Text>
                    </div>
                    <Text className="text-sm text-ui-fg-subtle truncate mb-2">
                      {contact.subject}
                    </Text>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(contact.status)}
                      <Text className="text-xs text-ui-fg-subtle">
                        {formatDate(contact.created_at)}
                      </Text>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => navigate("/contacts")}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Urgent Items Alert */}
      {stats && stats.urgent > 0 && (
        <div className="p-4 mt-4 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-center gap-2">
            <ExclamationCircle className="w-5 h-5 text-red-600" />
            <div>
              <Text className="font-medium text-red-900">
                {stats.urgent} urgent contact{stats.urgent > 1 ? 's' : ''} need immediate attention
              </Text>
              <Button
                variant="secondary"
                size="small"
                onClick={() => navigate("/contacts?priority=urgent")}
                className="mt-2"
              >
                Review Urgent Items
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ContactsOverviewWidget