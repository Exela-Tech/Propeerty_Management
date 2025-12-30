"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Database, UserPlus } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

export default function AdminSignUpPage() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<"signup" | "sql">("sql")

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const fullName = formData.get("fullName") as string
      const [firstName, ...lastNameParts] = fullName.split(" ")
      const lastName = lastNameParts.join(" ") || firstName
      const adminSecretKey = formData.get("adminSecretKey") as string

      // User must use the correct default key: SUPER_ADMIN_SECRET_2024
      // Or set ADMIN_SECRET_KEY in environment variables (server-side)

      const supabase = createBrowserClient()

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            admin_secret: adminSecretKey, // Pass to trigger function
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        // Attempt to create profile with admin role
        // This will only succeed if the secret key is valid (checked by database trigger/function)
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: "admin",
          is_admin: true,
        })

        if (profileError) {
          setError(profileError.message)
          setLoading(false)
          return
        }

        setSuccess(true)
        setError("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during sign up")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Super Admin Setup</CardTitle>
          <CardDescription>Create your first super admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-2">
            <Button
              type="button"
              variant={method === "sql" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMethod("sql")}
            >
              <Database className="mr-2 h-4 w-4" />
              SQL Method (Recommended)
            </Button>
            <Button
              type="button"
              variant={method === "signup" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMethod("signup")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Direct Signup
            </Button>
          </div>

          {method === "sql" ? (
            <div className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommended: SQL Method</strong>
                  <p className="mt-2">Follow these steps to create your first super admin:</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3 rounded-lg border bg-muted/50 p-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <strong>Sign up normally</strong>
                    <p className="text-muted-foreground">
                      Go to{" "}
                      <Link href="/auth/sign-up" className="text-primary hover:underline">
                        /auth/sign-up
                      </Link>{" "}
                      and create a regular account
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    2
                  </div>
                  <div>
                    <strong>Run the SQL script</strong>
                    <p className="text-muted-foreground">
                      Open <code className="rounded bg-muted px-1 py-0.5">scripts/002_create_first_admin.sql</code>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    3
                  </div>
                  <div>
                    <strong>Update your email</strong>
                    <p className="text-muted-foreground">Replace 'your-email@example.com' with your actual email</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    4
                  </div>
                  <div>
                    <strong>Execute the script</strong>
                    <p className="text-muted-foreground">Run the SQL script to promote yourself to super admin</p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Once you're a super admin, you can manage other users' roles from the admin dashboard at{" "}
                  <Link href="/admin/users" className="text-primary hover:underline">
                    /admin/users
                  </Link>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <Alert>
                <AlertDescription className="text-xs">
                  Note: Direct signup may not work in preview environments due to CORS restrictions. Use the SQL method
                  instead.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" type="text" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminSecretKey">Admin Secret Key</Label>
                <Input
                  id="adminSecretKey"
                  name="adminSecretKey"
                  type="password"
                  placeholder="Enter admin secret key"
                  required
                />
                <p className="text-xs text-muted-foreground">Contact your system administrator for the secret key</p>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>
                    Super admin account created successfully! You can now{" "}
                    <Link href="/auth/login" className="text-primary hover:underline">
                      log in
                    </Link>
                    .
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading || success}>
                {loading ? "Creating account..." : "Create Super Admin Account"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            <Link href="/auth/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
