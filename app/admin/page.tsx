import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, Users, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get stats
  const { count: totalProperties } = await supabase.from("properties").select("*", { count: "exact", head: true })

  const { count: pendingProperties } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: approvedProperties } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")

  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: totalLandlords } = await supabase.from("owners").select("*", { count: "exact", head: true })

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-semibold">PropertyHub Admin</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost">Browse</Button>
            </Link>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/")
              }}
            >
              <Button variant="ghost" type="submit">
                Logout
              </Button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage properties and users</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProperties || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingProperties || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Properties</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedProperties || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
                <CardDescription>Review and approve property listings</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Link href="/admin/properties">
                  <Button className="w-full">Review Properties</Button>
                </Link>
                <Link href="/admin/properties?status=pending">
                  <Button variant="outline" className="w-full bg-transparent">
                    View Pending ({pendingProperties || 0})
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and assign roles</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Link href="/admin/users">
                  <Button className="w-full">Manage Users</Button>
                </Link>
                <Link href="/admin/users?role=landlord">
                  <Button variant="outline" className="w-full bg-transparent">
                    View Landlords
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Landlord Management</CardTitle>
                <CardDescription>Create, edit, and delete landlord records</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Link href="/admin/landlords">
                  <Button className="w-full">Manage Landlords</Button>
                </Link>
                <Link href="/landlords/new">
                  <Button variant="outline" className="w-full bg-transparent">
                    Add New Landlord ({totalLandlords || 0} total)
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accounting</CardTitle>
                <CardDescription>Financial management and reports</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Link href="/admin/accounting">
                  <Button className="w-full">Accounting Dashboard</Button>
                </Link>
                <Link href="/admin/accounting/system">
                  <Button variant="outline" className="w-full bg-transparent">
                    Full Accounting System
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
