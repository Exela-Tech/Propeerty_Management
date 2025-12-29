import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@supabase/ssr"
import Link from "next/link"
import { Plus } from "lucide-react"
import { cookies } from "next/headers"
import { LandlordsContent } from "./landlords-content"

export const dynamic = "force-dynamic"

export default async function LandlordsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // ignore
        }
      },
    },
  })

  const { data: landlords, error } = await supabase.from("owners").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching landlords:", error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LANDLORDS</h1>
            <p className="text-muted-foreground">Manage landlord records for tracking and reporting</p>
          </div>
          <Link href="/landlords/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Landlord
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Failed to load landlords. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LANDLORDS</h1>
          <p className="text-muted-foreground">Manage landlord records for tracking and reporting</p>
        </div>
        <Link href="/landlords/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Landlord
          </Button>
        </Link>
      </div>
      <LandlordsContent initialLandlords={landlords || []} />
    </div>
  )
}
