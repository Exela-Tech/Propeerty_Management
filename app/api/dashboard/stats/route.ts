import { getServiceClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { successResponse, handleApiError } from "@/lib/api-response"

const log = logger.child("api:dashboard:stats")

export async function GET() {
  try {
    const supabase = getServiceClient()

    const [{ count: propertiesCount }, { data: unitsStats }, { data: tenantsStats }] = await Promise.all([
      // Get property count efficiently
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .limit(1),

      // Get unit statistics with status counts
      supabase
        .from("units")
        .select("status")
        .limit(10000), // Limit to prevent loading entire table

      // Get tenant payment statistics efficiently
      supabase
        .from("tenants")
        .select("balance,total_paid,status")
        .eq("status", "active")
        .limit(5000), // Limit active tenants
    ])

    // Calculate metrics from limited data
    const totalProperties = propertiesCount || 0
    const activeProperties = propertiesCount || 0

    // Process unit statistics
    const unitStats = Array.isArray(unitsStats) ? unitsStats : []
    const totalUnits = unitStats.length
    const occupiedUnits = unitStats.filter((u: any) => u.status === "occupied").length
    const vacantUnits = unitStats.filter((u: any) => u.status === "vacant").length
    const maintenanceUnits = unitStats.filter((u: any) => u.status === "under_maintenance").length
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

    // Process tenant statistics
    const tenantStats = Array.isArray(tenantsStats) ? tenantsStats : []
    const rentCollectedThisMonth =
      tenantStats.reduce((sum, t: any) => sum + Number.parseFloat(t.total_paid || 0), 0) || 0
    const outstandingBalance = tenantStats.reduce((sum, t: any) => sum + Number.parseFloat(t.balance || 0), 0) || 0
    const delayedPayments = tenantStats.filter((t: any) => Number.parseFloat(t.balance || 0) > 0).length

    const incomeExpenseData = [
      { month: "Oct", income: 45000, expense: 8500 },
      { month: "Nov", income: 52000, expense: 9200 },
      { month: "Dec", income: 58000, expense: 8800 },
    ]

    const revenueTrendData = [
      { month: "Jan", collected: 35000, outstanding: 5000 },
      { month: "Feb", collected: 38000, outstanding: 6000 },
      { month: "Mar", collected: 42000, outstanding: 4500 },
      { month: "Apr", collected: 45000, outstanding: 5500 },
      { month: "May", collected: 48000, outstanding: 6200 },
      { month: "Jun", collected: 50000, outstanding: 5800 },
      { month: "Jul", collected: 52000, outstanding: 5200 },
      { month: "Aug", collected: 54000, outstanding: 6000 },
      { month: "Sep", collected: 56000, outstanding: 5500 },
      { month: "Oct", collected: 45000, outstanding: 8500 },
      { month: "Nov", collected: 52000, outstanding: 9200 },
      { month: "Dec", collected: 58000, outstanding: 8800 },
    ]

    return successResponse({
      totalProperties,
      activeProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      maintenanceUnits,
      occupancyRate,
      rentCollectedThisMonth,
      outstandingBalance,
      delayedPayments,
      incomeExpenseData,
      revenueTrendData,
    })
  } catch (error) {
    return handleApiError(error, "dashboard:stats:GET")
  }
}
