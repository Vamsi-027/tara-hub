import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge } from "@medusajs/ui"
import { ChatBubbleLeftRight, ArrowUpRightOnBox } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

interface ContactStats {
  new: number
  in_progress: number
  today: number
  response_rate: number
}

interface RecentContact {
  id: string
  name: string
  subject: string
  status: string
  created_at: string
}

const ContactsOverviewWidget = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsRes = await fetch("/admin/contacts/stats")
        if (statsRes.ok) setStats(await statsRes.json())

        const contactsRes = await fetch("/admin/contacts?limit=5")
        if (contactsRes.ok) {
          const data = await contactsRes.json()
          setRecentContacts(data.contacts)
        }
      } catch (error) {
        console.error("Error loading contact data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <Container className="p-6">
        <Heading level="h3">Customer Contacts</Heading>
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
        >
          View All <ArrowUpRightOnBox className="w-3 h-3" />
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "dashboard.before"
})

export default ContactsOverviewWidget
