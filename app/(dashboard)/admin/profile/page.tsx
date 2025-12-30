import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Settings } from "lucide-react"
import Link from "next/link"
import { AdminProfileForm } from "./admin-profile-form"

export default async function AdminProfilePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Admin profile - User exists:", !!user)
  console.log("[v0] Admin profile - User ID:", user?.id)

  if (!user) {
    console.log("[v0] Admin profile - Redirecting to login: No user found")
    redirect("/auth/login")
  }

  // Fetch admin profile
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("[v0] Admin profile - Profile query error:", error)
  console.log("[v0] Admin profile - Profile data:", profile)
  console.log("[v0] Admin profile - Is Admin:", profile?.is_admin)

  if (!profile) {
    console.log("[v0] Admin profile - Redirecting to dashboard: No profile found")
    redirect("/dashboard")
  }

  if (!profile?.is_admin) {
    console.log("[v0] Admin profile - Redirecting to dashboard: Not an admin")
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Profile</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              User Management
            </Link>
            <form
              action={async () => {
                "use server"
                const cookieStore = await cookies()
                const supabase = createServerClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  {
                    cookies: {
                      getAll() {
                        return cookieStore.getAll()
                      },
                      setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                          cookieStore.set(name, value, options)
                        })
                      },
                    },
                  },
                )
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
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Overview Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">
                    {profile.first_name} {profile.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-semibold capitalize">{profile.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-semibold">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Form */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Edit Profile
                </CardTitle>
                <CardDescription>Update your profile information and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminProfileForm profile={profile} userId={user.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
