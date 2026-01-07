import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getPendingActions } from "@/app/(dashboard)/team/pending-actions"
import Link from "next/link"
import { Clock, CheckCircle, XCircle, Plus } from "lucide-react"

export default async function TeamMemberDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "team_member") {
    redirect("/dashboard")
  }

  const pendingActions = await getPendingActions(user.id)
  const pendingCount = pendingActions.filter((a) => a.status === "pending").length
  const approvedCount = pendingActions.filter((a) => a.status === "approved").length
  const rejectedCount = pendingActions.filter((a) => a.status === "rejected").length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Team Member Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile.first_name}! Submit actions for admin approval.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Needs revision</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Submit new actions for approval</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button asChild variant="outline" className="h-24 bg-transparent">
            <Link href="/team-member/payments/new" className="flex flex-col items-center justify-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Record Payment</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-24 bg-transparent">
            <Link href="/team-member/expenses/new" className="flex flex-col items-center justify-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Record Expense</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-24 bg-transparent">
            <Link href="/team-member/maintenance/new" className="flex flex-col items-center justify-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Maintenance Request</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Your latest actions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingActions.length === 0 ? (
              <p className="text-center text-muted-foreground">No submissions yet</p>
            ) : (
              pendingActions.slice(0, 10).map((action) => (
                <div key={action.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium capitalize">{action.action_type.replace("_", " ")}</p>
                    <p className="text-sm text-muted-foreground">{new Date(action.created_at).toLocaleDateString()}</p>
                    {action.notes && <p className="text-sm text-muted-foreground">{action.notes}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    {action.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                    {action.status === "approved" && <Badge className="bg-green-600">Approved</Badge>}
                    {action.status === "rejected" && (
                      <div className="text-right">
                        <Badge variant="destructive">Rejected</Badge>
                        {action.rejection_reason && (
                          <p className="text-xs text-muted-foreground mt-1">{action.rejection_reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
