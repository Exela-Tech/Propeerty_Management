import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Shield, Building2, Plus, Edit2, Trash2 } from "lucide-react"
import Link from "next/link"
import { deleteLandlord } from "@/app/(dashboard)/landlords/actions"
import { LandlordsClientContent } from "./landlords-client"

export default async function AdminLandlordsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all landlords (owners)
  const { data: landlords, error } = await supabase.from("owners").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching landlords:", error)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Panel</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Users
            </Link>
            <Link href="/admin/landlords" className="text-sm font-medium text-foreground">
              Landlords
            </Link>
            <Link href="/admin/properties" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Properties
            </Link>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/auth/login")
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Landlord Management</h1>
              <p className="text-muted-foreground">Create, edit, and delete landlord records</p>
            </div>
            <Link href="/landlords/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Landlord
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Landlords
              </CardTitle>
              <CardDescription>Manage all landlord records in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <LandlordsClientContent initialLandlords={landlords || []} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
