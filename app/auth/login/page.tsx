"use client"

import type React from "react"

import { login } from "@/app/actions/auth"
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
    setIsLoading(true)
    setError(null)

    const result = await login({
      email,
      password,
    })

    if (!result.success) {
      // Format validation errors for display
      if (result.error.code === "VALIDATION_ERROR" && result.error.details?.errors) {
        const errors = result.error.details.errors as Array<{ path: string[]; message: string }>
        const errorMessages = errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        setError(errorMessages)
      } else {
        setError(result.error.message)
      }
      setIsLoading(false)
      return
    }

    // Use Next.js router for proper client-side navigation
    router.push("/dashboard")
    router.refresh() // Refresh to ensure server components get updated session
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8" />
          <h1 className="text-2xl font-bold">PropertyPro</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your property management dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="landlord@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-foreground underline underline-offset-4 hover:text-primary">
                  Create account
                </Link>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                System administrator?{" "}
                <Link
                  href="/auth/admin-signup"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Admin signup
                </Link>
              </div>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                Team member?{" "}
                <Link
                  href="/auth/team-member-signup"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Accept invitation
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
