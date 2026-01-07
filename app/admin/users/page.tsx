import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PendingRegistrationsTable } from "./pending-registrations-table"
import { ExistingUsersTable } from "./existing-users-table"
import { getPendingRegistrations, getAllUsers } from "./user-management-actions"

async function updateUserRole(formData: FormData) {
  "use server"
  const supabase = await createClient()

  const userId = formData.get("userId") as string
  const newRole = formData.get("role") as string
  const isAdmin = newRole === "admin"

  await supabase
    .from("profiles")
    .update({
      role: newRole,
      is_admin: isAdmin,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  redirect("/admin/users")
}

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  const pendingRegistrations = await getPendingRegistrations()
  const allUsers = await getAllUsers()

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold">User Management</h1>
        <p className="text-lg text-muted-foreground">Review registrations, manage users, and control access</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Pending Registrations
              </CardTitle>
              <CardDescription>Review and approve user registration requests</CardDescription>
            </div>
            <Badge variant="secondary" className="h-8 px-3">
              {pendingRegistrations.length} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <PendingRegistrationsTable registrations={pendingRegistrations} />
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">All Users</h2>
        <Button asChild>
          <Link href="/admin/users/create">
            <UserPlus className="mr-2 h-4 w-4" />
            Create User Manually
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Existing Users ({allUsers.length})
          </CardTitle>
          <CardDescription>Manage roles, disable/enable, or delete users</CardDescription>
        </CardHeader>
        <CardContent>
          <ExistingUsersTable users={allUsers} />
        </CardContent>
      </Card>
    </div>
  )
}
