import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const log = logger.child("api:landlords:payment-note")

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: landlordId } = await params
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    const month = searchParams.get("month") || new Date().toISOString().substring(0, 7)

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    })

    const { data: landlord, error: landlordError } = await supabase
      .from("owners")
      .select("id, name, created_at")
      .eq("id", landlordId)
      .single()

    if (landlordError || !landlord) {
      return NextResponse.json({ error: "Landlord not found" }, { status: 404 })
    }

    const landlordCreatedMonth = new Date(landlord.created_at).toISOString().substring(0, 7)
    if (month < landlordCreatedMonth) {
      return NextResponse.json({
        landlord: { id: landlord.id, name: landlord.name },
        property: { id: propertyId, name: "" },
        month,
        tenantDetails: [],
        totalExpectedRent: 0,
        deductions: [],
        totalDeductions: 0,
        netPayout: 0,
        message: "No data available before landlord creation date",
      })
    }

    // Fetch property with management fee
    const { data: property } = await supabase
      .from("properties")
      .select("id, name, management_fee, management_fee_type")
      .eq("id", propertyId)
      .single()

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Fetch all active tenants for this property
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, first_name, last_name, monthly_rent, unit_number")
      .eq("property_id", propertyId)
      .eq("status", "active")

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        landlord,
        property,
        month,
        tenantDetails: [],
        totalExpectedRent: 0,
        deductions: [],
        totalDeductions: 0,
        netPayout: 0,
      })
    }

    const [monthStart, monthEnd] = [month + "-01", new Date(month + "-01")]
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0)
    const monthEndStr = monthEnd.toISOString().substring(0, 10)

    log.debug("Fetching maintenance for month", { month, propertyId })

    const { data: maintenanceRequests } = await supabase
      .from("maintenance_requests")
      .select("id, title, estimated_cost, approved, deduction_month")
      .eq("property_id", propertyId)
      .eq("deduction_month", month)

    log.debug("Maintenance query result", {
      month,
      propertyId,
      count: maintenanceRequests?.length || 0,
    })

    // Calculate total expected rent
    const totalExpectedRent = tenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0)

    // Calculate management fee
    const managementFeeAmount =
      property.management_fee_type === "percentage"
        ? (totalExpectedRent * (property.management_fee || 10)) / 100
        : property.management_fee || 0

    // Build deductions array
    const deductions = [
      {
        description: `Management Fee (${property.management_fee_type === "percentage" ? property.management_fee + "%" : "UGX " + Math.round(property.management_fee || 0).toLocaleString()})`,
        amount: managementFeeAmount,
      },
      ...(maintenanceRequests || []).map((m) => ({
        description: m.title,
        amount: m.estimated_cost || 0,
      })),
    ]

    const totalDeductions =
      managementFeeAmount + ((maintenanceRequests || []).reduce((sum, m) => sum + (m.estimated_cost || 0), 0) || 0)
    const netPayout = totalExpectedRent - totalDeductions

    const tenantIds = tenants.map((t) => t.id)

    // Fetch tenant payments for the specified month
    const { data: tenantPayments } = await supabase
      .from("tenant_payments")
      .select("tenant_id, amount, payment_date")
      .in("tenant_id", tenantIds)
      .gte("payment_date", monthStart)
      .lte("payment_date", monthEndStr)

    // Build tenant details
    const tenantDetails = tenants.map((tenant, index) => ({
      id: tenant.id,
      number: index + 1,
      name: `${tenant.first_name} ${tenant.last_name}`,
      unitNumber: tenant.unit_number,
      expectedAmount: tenant.monthly_rent || 0,
    }))

    return NextResponse.json({
      landlord,
      property,
      month,
      tenantDetails,
      totalExpectedRent,
      deductions,
      totalDeductions,
      netPayout,
    })
  } catch (error) {
    log.error("Error in payment note API", error, { landlordId, propertyId, month })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
