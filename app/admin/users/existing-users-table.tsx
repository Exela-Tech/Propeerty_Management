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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
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
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { toast } = useToast()

  const handleUpdateRole = async () => {
    if (!roleDialog.userId) return

     // Prevent demoting the last active admin
    const targetUser = users.find((u) => u.id === roleDialog.userId)
    const activeAdminCount = users.filter((u) => u.role === "admin" && u.is_active).length
    const isDemotingLastAdmin =
      targetUser && targetUser.role === "admin" && targetUser.is_active && selectedRole !== "admin" && activeAdminCount === 1

    if (isDemotingLastAdmin) {
      const message = "You cannot remove the last active admin. Create another admin first."
      setMessage({ type: "error", text: message })
      toast({
        title: "Cannot change role",
        description: message,
        variant: "destructive",
      })
      return
    }

    setLoadingUserId(roleDialog.userId)
    setMessage(null)
    const result = await updateUserRole(roleDialog.userId, selectedRole)
    setLoadingUserId(null)
    setRoleDialog({ open: false })
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
      toast({
        title: "Failed to update role",
        description: result.error,
        variant: "destructive",
      })
    } else {
      const msg = "User role updated successfully."
      setMessage({ type: "success", text: msg })
      toast({
        title: "Role updated",
        description: msg,
      })
    }
  }

  const handleDisable = async () => {
    if (!disableDialog.userId) return

    const targetUser = users.find((u) => u.id === disableDialog.userId)
    const activeAdminCount = users.filter((u) => u.role === "admin" && u.is_active).length
    const isDisablingLastAdmin =
      targetUser && targetUser.role === "admin" && targetUser.is_active && activeAdminCount === 1

    if (isDisablingLastAdmin) {
      const message = "You cannot disable the last active admin. Create another admin first."
      setMessage({ type: "error", text: message })
      toast({
        title: "Cannot disable user",
        description: message,
        variant: "destructive",
      })
      return
    }

    setLoadingUserId(disableDialog.userId)
    setMessage(null)
    const result = await disableUser(disableDialog.userId, disableReason)
    setLoadingUserId(null)
    setDisableDialog({ open: false })
    setDisableReason("")
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
      toast({
        title: "Failed to disable user",
        description: result.error,
        variant: "destructive",
      })
    } else {
      const msg = "User disabled successfully."
      setMessage({ type: "success", text: msg })
      toast({
        title: "User disabled",
        description: msg,
      })
    }
  }

  const handleEnable = async (userId: string) => {
    setLoadingUserId(userId)
    setMessage(null)
    const result = await enableUser(userId)
    setLoadingUserId(null)
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
      toast({
        title: "Failed to enable user",
        description: result.error,
        variant: "destructive",
      })
    } else {
      const msg = "User enabled successfully."
      setMessage({ type: "success", text: msg })
      toast({
        title: "User enabled",
        description: msg,
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.userId) return

    const targetUser = users.find((u) => u.id === deleteDialog.userId)
    const activeAdminCount = users.filter((u) => u.role === "admin" && u.is_active).length
    const isDeletingLastAdmin =
      targetUser && targetUser.role === "admin" && targetUser.is_active && activeAdminCount === 1

    if (isDeletingLastAdmin) {
      const message = "You cannot delete the last active admin. Create another admin first."
      setMessage({ type: "error", text: message })
      toast({
        title: "Cannot delete user",
        description: message,
        variant: "destructive",
      })
      return
    }

    setLoadingUserId(deleteDialog.userId)
    setMessage(null)
    const result = await deleteUser(deleteDialog.userId)
    setLoadingUserId(null)
    setDeleteDialog({ open: false })
    if (result?.error) {
      setMessage({ type: "error", text: result.error })
      toast({
        title: "Failed to delete user",
        description: result.error,
        variant: "destructive",
      })
    } else {
      const msg = "User deleted successfully."
      setMessage({ type: "success", text: msg })
      toast({
        title: "User deleted",
        description: msg,
      })
    }
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
      {message && (
        <div className="mb-4">
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        </div>
      )}
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
                      disabled={loadingUserId === user.id}
                    >
                      <Ban className="mr-1 h-4 w-4" />
                      Disable
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEnable(user.id)}
                      disabled={loadingUserId === user.id}
                    >
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
            <DialogDescription>Change the user&apos;s role and permissions</DialogDescription>
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
            <Button
              onClick={handleUpdateRole}
              disabled={roleDialog.userId ? loadingUserId === roleDialog.userId : false || !selectedRole}
            >
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
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={!disableReason || (disableDialog.userId ? loadingUserId === disableDialog.userId : false)}
            >
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
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDialog.userId ? loadingUserId === deleteDialog.userId : false}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
