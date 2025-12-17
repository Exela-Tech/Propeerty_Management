import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PaymentForm } from "@/components/payment-form"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewPaymentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "landlord" && profile.role !== "blocker")) {
    redirect("/dashboard")
  }

  // Get landlord's properties
  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, address, monthly_rent, currency")
    .eq("landlord_id", user.id)

  const propertyIds = properties?.map((p) => p.id) || []

  // Get tenants for landlord's properties
  const { data: tenants } = await supabase
    .from("tenants")
    .select(
      `
      id,
      monthly_rent,
      properties!tenants_property_id_fkey(title, address),
      profiles!tenants_renter_id_fkey(full_name, email)
    `,
    )
    .in("property_id", propertyIds.length > 0 ? propertyIds : [""])
    .eq("status", "active")

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
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="ghost">Payments</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Add Payment Record</h1>
            <p className="text-muted-foreground">Create a new rent payment record</p>
          </div>

          <PaymentForm tenants={tenants || []} />
        </div>
      </main>
    </div>
  )
}
