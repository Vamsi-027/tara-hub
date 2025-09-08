import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Table, Badge, Button, Toaster, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { ChatBubbleLeftRight, Trash, Eye } from "@medusajs/icons"

// Simple contact viewer that reads from a JSON file
const ContactsViewer = () => {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<any>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      // For now, we'll use mock data
      // In production, this would fetch from the database
      const mockContacts = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          phone: "+1 555-123-4567",
          subject: "Product Inquiry",
          message: "I'm interested in your cotton fabrics for upholstery.",
          status: "new",
          created_at: new Date().toISOString()
        }
      ]
      
      setContacts(mockContacts)
      toast.success("Contacts loaded successfully")
    } catch (error) {
      console.error("Error loading contacts:", error)
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      new: "orange",
      in_progress: "blue",
      resolved: "green",
      closed: "grey"
    }
    
    return (
      <Badge color={colors[status] || "grey"}>
        {status.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRight className="w-6 h-6" />
          <Heading level="h1">Contact Submissions</Heading>
        </div>
        <Button onClick={loadContacts} variant="secondary">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Text>Loading contacts...</Text>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ChatBubbleLeftRight className="w-12 h-12 text-gray-400 mb-4" />
          <Heading level="h3" className="mb-2">No Contact Submissions Yet</Heading>
          <Text className="text-gray-600">
            Contact form submissions will appear here when customers reach out.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Subject</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {contacts.map((contact) => (
              <Table.Row key={contact.id}>
                <Table.Cell>{contact.name}</Table.Cell>
                <Table.Cell>{contact.email}</Table.Cell>
                <Table.Cell>{contact.subject}</Table.Cell>
                <Table.Cell>{getStatusBadge(contact.status)}</Table.Cell>
                <Table.Cell>
                  {new Date(contact.created_at).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <Heading level="h2" className="mb-4">Contact Details</Heading>
            <div className="space-y-4">
              <div>
                <Text className="font-semibold">Name:</Text>
                <Text>{selectedContact.name}</Text>
              </div>
              <div>
                <Text className="font-semibold">Email:</Text>
                <Text>{selectedContact.email}</Text>
              </div>
              {selectedContact.phone && (
                <div>
                  <Text className="font-semibold">Phone:</Text>
                  <Text>{selectedContact.phone}</Text>
                </div>
              )}
              <div>
                <Text className="font-semibold">Subject:</Text>
                <Text>{selectedContact.subject}</Text>
              </div>
              <div>
                <Text className="font-semibold">Message:</Text>
                <div className="bg-gray-50 p-3 rounded mt-1">
                  <Text>{selectedContact.message}</Text>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setSelectedContact(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Contact Forms",
  icon: ChatBubbleLeftRight,
})

export default ContactsViewer