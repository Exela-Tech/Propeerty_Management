"use client"

import type React from "react"
import Image from "next/image"

import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createBrowserClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active, requires_password_change, status")
        .eq("id", data.user?.id)
        .single()

      // Check if account is disabled
      if (!profile?.is_active || profile?.status === "disabled") {
        await supabase.auth.signOut()
        setError("Your account has been disabled. Please contact an administrator.")
        setIsLoading(false)
        return
      }

      // Check if password change is required
      if (profile?.requires_password_change) {
        router.push("/auth/change-password")
        return
      }

      // Update last login
      await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id)

      setTimeout(() => {
        // Redirect based on role
        if (
          profile?.role === "team_member" ||
          profile?.role === "property_manager" ||
          profile?.role === "accountant" ||
          profile?.role === "support_staff"
        ) {
          router.push("/team-member/dashboard")
        } else if (profile?.role === "tenant") {
          router.push("/tenant/dashboard")
        } else if (profile?.role === "landlord") {
          router.push("/landlord/dashboard")
        } else {
          // Admin or other roles
          router.push("/dashboard")
        }
      }, 100)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center justify-center gap-3">
  <Image
    src="/Exela.png"
    alt="Exela Property Management Software"
    width={80}
    height={80}
    priority
  />
  <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
    EXELA PMS
  </h1>
</div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-750 rounded-t-lg border-b border-border">
            <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">Welcome back</CardTitle>
            <CardDescription>Sign in to access your property management dashboard</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hover:border-blue-400 focus:border-blue-600 dark:hover:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hover:border-blue-400 focus:border-blue-600 dark:hover:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Register here
                </Link>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                System administrator?{" "}
                <Link
                  href="/auth/admin-signup"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Admin signup
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
