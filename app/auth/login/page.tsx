"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  /**
   * Verifies that the session is established by polling for the user session.
   * This replaces the hardcoded delay with proper session verification.
   */
  const verifySession = async (supabase: ReturnType<typeof createClient>, maxAttempts = 10): Promise<boolean> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session && !error) {
        return true
      }
      
      // Wait 100ms before next attempt (total max wait: 1 second)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    
    return false
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Verify session is established instead of using hardcoded delay
      const sessionVerified = await verifySession(supabase)
      
      if (sessionVerified) {
        // Use Next.js router for proper client-side navigation
        router.push("/dashboard")
        router.refresh() // Refresh to ensure server components get updated session
      } else {
        throw new Error("Session verification failed. Please try again.")
      }
    } catch (error: unknown) {
      let errorMessage = error instanceof Error ? error.message : "An error occurred"

      if (errorMessage.includes("Email not confirmed")) {
        errorMessage =
          "Please confirm your email address before logging in. Check your inbox for the confirmation link."
      } else if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again."
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
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
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
