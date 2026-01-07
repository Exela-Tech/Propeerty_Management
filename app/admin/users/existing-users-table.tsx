"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Ban, CheckCircle, Trash2 } from "lucide-react"
import { updateUserRole, disableUser, enableUser, deleteUser } from "./user-management-actions"

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: string
  is_active: boolean
  disabled_reason?: string
  created_at: string
}

export function ExistingUsersTable({ users }: { users: User[] }) {
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId?: string; currentRole?: string }>({
    open: false,
  })
  const [selectedRole, setSelectedRole] = useState("")
  const [disableDialog, setDisableDialog] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [disableReason, setDisableReason] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string; userName?: string }>({
    open: false,
  })
  const [loading, setLoading] = useState(false)

  const handleUpdateRole = async () => {
    if (!roleDialog.userId) return

    setLoading(true)
    await updateUserRole(roleDialog.userId, selectedRole)
    setLoading(false)
    setRoleDialog({ open: false })
  }

  const handleDisable = async () => {
    if (!disableDialog.userId) return

    setLoading(true)
    await disableUser(disableDialog.userId, disableReason)
    setLoading(false)
    setDisableDialog({ open: false })
    setDisableReason("")
  }

  const handleEnable = async (userId: string) => {
    setLoading(true)
    await enableUser(userId)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteDialog.userId) return

    setLoading(true)
    await deleteUser(deleteDialog.userId)
    setLoading(false)
    setDeleteDialog({ open: false })
  }

  const roleColors: Record<string, string> = {
    admin: "bg-purple-500/10 text-purple-700 border-purple-200",
    landlord: "bg-green-500/10 text-green-700 border-green-200",
    tenant: "bg-blue-500/10 text-blue-700 border-blue-200",
    property_manager: "bg-orange-500/10 text-orange-700 border-orange-200",
    accountant: "bg-pink-500/10 text-pink-700 border-pink-200",
    support_staff: "bg-gray-500/10 text-gray-700 border-gray-200",
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "-"}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge className={roleColors[user.role] || ""}>{user.role?.replace("_", " ").toUpperCase()}</Badge>
              </TableCell>
              <TableCell>
                {user.is_active ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                    Disabled
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRoleDialog({ open: true, userId: user.id, currentRole: user.role })
                      setSelectedRole(user.role)
                    }}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Role
                  </Button>
                  {user.is_active ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDisableDialog({ open: true, userId: user.id })}
                    >
                      <Ban className="mr-1 h-4 w-4" />
                      Disable
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleEnable(user.id)} disabled={loading}>
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Enable
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setDeleteDialog({
                        open: true,
                        userId: user.id,
                        userName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
                      })
                    }
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Update Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>Change the user's role and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="role">Select New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="landlord">Landlord</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="property_manager">Property Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="support_staff">Support Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={loading}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable User Dialog */}
      <Dialog open={disableDialog.open} onOpenChange={(open) => setDisableDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable User</DialogTitle>
            <DialogDescription>Provide a reason for disabling this user account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="disable-reason">Reason</Label>
            <Textarea
              id="disable-reason"
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Enter reason for disabling user..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialog({ open: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable} disabled={!disableReason || loading}>
              Disable User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {deleteDialog.userName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
