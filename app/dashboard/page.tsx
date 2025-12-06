import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("[Dashboard] Auth error:", error.message)
      // If user doesn't exist in auth, clear session and redirect
      if (error.message.includes("User from sub claim in JWT does not exist")) {
        await supabase.auth.signOut()
      }
      redirect("/auth/login")
    }

    user = data.user
  } catch (error) {
    console.error("[Dashboard] Failed to get user:", error)
    redirect("/auth/login")
  }

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    console.log("[v0] Profile not found, creating one for user:", user.id)

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
        role: user.user_metadata?.role || "seller",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating profile:", insertError)
      redirect("/auth/login")
    }

    profile = newProfile
  }

  // Get stats based on role
  const stats = {
    properties: 0,
    revenue: 0,
  }

  if (["seller", "blocker", "landlord"].includes(profile.role)) {
    const { count: propertyCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("landlord_id", user.id)

    stats.properties = propertyCount || 0
  } else if (profile.role === "admin") {
    const { count: propertyCount } = await supabase.from("properties").select("*", { count: "exact", head: true })

    stats.properties = propertyCount || 0
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-semibold">PropertyHub</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/browse">
              <Button variant="ghost">Browse</Button>
            </Link>
            {["seller", "blocker", "landlord"].includes(profile.role) && (
              <Link href="/dashboard/properties">
                <Button variant="ghost">My Properties</Button>
              </Link>
            )}
            {profile.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost">Admin Panel</Button>
              </Link>
            )}
            <Link href="/dashboard/payments">
              <Button variant="ghost">Payments</Button>
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
            <h1 className="text-3xl font-bold">Welcome back, {profile.full_name || "User"}!</h1>
            <p className="text-muted-foreground">
              {profile.role === "admin" && "Manage properties and users"}
              {profile.role === "seller" && "Manage your property listings"}
              {profile.role === "blocker" && "Manage your property listings"}
              {profile.role === "landlord" && "Manage your rental properties"}
            </p>
          </div>

          {/* Stats Cards */}
          {["seller", "blocker", "landlord", "admin"].includes(profile.role) && (
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.properties}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {["seller", "blocker", "landlord"].includes(profile.role) && (
                <>
                  <Link href="/dashboard/properties/new">
                    <Button>Add New Property</Button>
                  </Link>
                  <Link href="/dashboard/properties">
                    <Button variant="outline">View My Properties</Button>
                  </Link>
                  <Link href="/dashboard/payments">
                    <Button variant="outline">View Payments</Button>
                  </Link>
                </>
              )}
              {profile.role === "admin" && (
                <>
                  <Link href="/admin">
                    <Button>Admin Dashboard</Button>
                  </Link>
                  <Link href="/admin/properties">
                    <Button variant="outline">Review Properties</Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button variant="outline">Manage Users</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
