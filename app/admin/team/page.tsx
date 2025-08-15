"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  Edit,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"

interface TeamMember {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  joinedAt: string
  invitedBy?: string
}

export default function TeamManagementPage() {
  const { data: session } = useSession()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer')
  const [inviting, setInviting] = useState(false)

  // Load team members
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      } else {
        toast.error("Failed to load team members")
      }
    } catch (error) {
      toast.error("Error loading team members")
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address")
      return
    }

    setInviting(true)
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (response.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`)
        setInviteEmail("")
        setInviteRole('viewer')
        setInviteDialogOpen(false)
        fetchTeamMembers()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to send invitation")
      }
    } catch (error) {
      toast.error("Error sending invitation")
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast.success("Role updated successfully")
        fetchTeamMembers()
      } else {
        toast.error("Failed to update role")
      }
    } catch (error) {
      toast.error("Error updating role")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return
    }

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success("Team member removed")
        fetchTeamMembers()
      } else {
        toast.error("Failed to remove team member")
      }
    } catch (error) {
      toast.error("Error removing team member")
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'editor':
        return 'default'
      case 'viewer':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading team members...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Team Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage team members and their permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View and manage all team members and their roles
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex flex-col">
                            <span className="font-medium">Admin</span>
                            <span className="text-xs text-muted-foreground">Full access to all features</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex flex-col">
                            <span className="font-medium">Editor</span>
                            <span className="text-xs text-muted-foreground">Can create and edit content</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex flex-col">
                            <span className="font-medium">Viewer</span>
                            <span className="text-xs text-muted-foreground">Read-only access</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviting}>
                    {inviting ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name || member.email}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role) as any}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(member.status)}
                      <span className="capitalize">{member.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingMember(member)}
                        disabled={member.email === session?.user?.email}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={member.email === session?.user?.email}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update role and permissions for {editingMember.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={editingMember.role}
                  onValueChange={(value) =>
                    handleUpdateRole(editingMember.id, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setEditingMember(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}