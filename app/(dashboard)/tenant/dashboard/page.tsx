import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, DollarSign, Wrench, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TenantDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "tenant") {
    redirect("/dashboard")
  }

  // Get tenant data
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", user.id).single()

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold">Welcome, {profile.first_name}!</h1>
        <p className="text-lg text-muted-foreground">Your tenant dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              My Unit
            </CardTitle>
            <CardDescription>View your unit details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tenant?.unit_number || "N/A"}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Monthly Rent: UGX {tenant?.monthly_rent?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>View your payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/tenant/payments">View Payments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance
            </CardTitle>
            <CardDescription>Submit maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/maintenance/new">Submit Request</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-start bg-transparent">
            <Link href="/tenant/payments">
              <DollarSign className="mr-2 h-4 w-4" />
              View Payment History
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start bg-transparent">
            <Link href="/maintenance">
              <Wrench className="mr-2 h-4 w-4" />
              My Maintenance Requests
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start bg-transparent">
            <Link href="/tenant/documents">
              <FileText className="mr-2 h-4 w-4" />
              Lease Documents
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}