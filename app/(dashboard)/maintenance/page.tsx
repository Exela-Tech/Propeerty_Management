import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApproveRejectButtons } from "./approve-reject-buttons"
import { MaintenanceActionButtons } from "./maintenance-action-buttons"

async function getMaintenanceRequests() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: requests, error } = await supabase
      .from("maintenance_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching maintenance requests:", error)
      return []
    }

    if (!requests || requests.length === 0) {
      return []
    }

    const propertyIds = [...new Set(requests.map((r) => r.property_id).filter(Boolean))]
    const unitIds = [...new Set(requests.map((r) => r.unit_id).filter(Boolean))]
    const tenantIds = [...new Set(requests.map((r) => r.tenant_id).filter(Boolean))]

    const [propertiesData, unitsData, tenantsData] = await Promise.all([
      propertyIds.length > 0
        ? supabase.from("properties").select("id, name").in("id", propertyIds)
        : Promise.resolve({ data: [] }),
      unitIds.length > 0
        ? supabase.from("units").select("id, unit_number").in("id", unitIds)
        : Promise.resolve({ data: [] }),
      tenantIds.length > 0
        ? supabase.from("tenants").select("id, first_name, last_name").in("id", tenantIds)
        : Promise.resolve({ data: [] }),
    ])

    const propertiesMap = new Map(propertiesData.data?.map((p) => [p.id, p]) || [])
    const unitsMap = new Map(unitsData.data?.map((u) => [u.id, u]) || [])
    const tenantsMap = new Map(tenantsData.data?.map((t) => [t.id, t]) || [])

    return requests.map((request) => ({
      ...request,
      property: request.property_id ? propertiesMap.get(request.property_id) : null,
      unit: request.unit_id ? unitsMap.get(request.unit_id) : null,
      tenant: request.tenant_id ? tenantsMap.get(request.tenant_id) : null,
    }))
  } catch (error) {
    console.error("Error fetching maintenance requests:", error)
    return []
  }
}

export default async function MaintenancePage() {
  const requests = await getMaintenanceRequests()

  const pendingRequests = requests.filter((r) => !r.approved && r.status !== "cancelled")
  const completedRequests = requests.filter((r) => r.approved || r.status === "cancelled")

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-1">Review and approve maintenance requests</p>
        </div>
        <Button asChild>
          <Link href="/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Approval ({pendingRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending requests</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Estimated Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{request.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.property?.name || "N/A"}</TableCell>
                      <TableCell>{request.unit?.unit_number || "-"}</TableCell>
                      <TableCell>
                        {request.tenant ? `${request.tenant.first_name} ${request.tenant.last_name}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.priority === "high"
                              ? "destructive"
                              : request.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.estimated_cost
                          ? `${request.currency || "UGX"} ${request.estimated_cost.toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.status?.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <ApproveRejectButtons requestId={request.id} />
                        <MaintenanceActionButtons requestId={request.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History ({completedRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {completedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No completed requests</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedRequests.map((request) => (
                    <TableRow key={request.id} className="opacity-75">
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{request.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.property?.name || "N/A"}</TableCell>
                      <TableCell>{request.unit?.unit_number || "-"}</TableCell>
                      <TableCell>
                        {request.tenant ? `${request.tenant.first_name} ${request.tenant.last_name}` : "-"}
                      </TableCell>
                      <TableCell>
                        {request.estimated_cost
                          ? `${request.currency || "UGX"} ${request.estimated_cost.toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.approved ? "default" : "destructive"}>
                          {request.approved ? "Approved" : "Rejected"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(request.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
