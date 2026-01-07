import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPendingActions } from "@/app/(dashboard)/team/pending-actions"
import { ApprovalActions } from "./approval-actions"

export default async function AdminApprovalsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !profile.is_admin) {
    redirect("/dashboard")
  }

  const allActions = await getPendingActions()
  const pendingActions = allActions.filter((a) => a.status === "pending")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and approve team member submissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions Awaiting Approval ({pendingActions.length})</CardTitle>
          <CardDescription>Review each action carefully before approving</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingActions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending actions</p>
            ) : (
              pendingActions.map((action) => (
                <Card key={action.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg capitalize">{action.action_type.replace("_", " ")}</CardTitle>
                        <CardDescription>
                          Submitted by {action.team_member?.first_name} {action.team_member?.last_name} on{" "}
                          {new Date(action.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {action.notes && (
                        <div>
                          <p className="text-sm font-medium">Notes:</p>
                          <p className="text-sm text-muted-foreground">{action.notes}</p>
                        </div>
                      )}
                      <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm font-medium mb-2">Action Data:</p>
                        <pre className="text-xs overflow-auto">{JSON.stringify(action.action_data, null, 2)}</pre>
                      </div>
                      <ApprovalActions actionId={action.id} reviewerId={user.id} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
