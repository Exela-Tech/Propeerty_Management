"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { verifyInvitationToken, acceptInvitationAndCreateAccount } from "./actions"

export function TeamMemberSignupForm() {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [verifyingToken, setVerifyingToken] = useState(false)
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Get token from URL params
    const urlToken = searchParams.get("token")
    if (urlToken) {
      setToken(urlToken)
      verifyToken(urlToken)
    }
  }, [searchParams])

  const verifyToken = async (tokenValue: string) => {
    setVerifyingToken(true)
    const result = await verifyInvitationToken(tokenValue)
    if (result.error) {
      setError(result.error)
    } else {
      setInvitationData(result.data)
    }
    setVerifyingToken(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError("Invitation token is required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    const result = await acceptInvitationAndCreateAccount(token, password)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle>Account Created!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Your account has been successfully created. You can now log in with your email and password.
          </p>
          <p className="text-xs text-muted-foreground">Redirecting to login...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Member Signup</CardTitle>
        <CardDescription>Accept your invitation and create your account</CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No invitation token found. Please use the invitation link sent to your email.
              </AlertDescription>
            </Alert>
            <Link href="/auth/login" className="text-center text-sm text-primary hover:underline block">
              Back to login
            </Link>
          </div>
        ) : verifyingToken ? (
          <div className="flex justify-center py-6">
            <div className="animate-pulse text-muted-foreground">Verifying invitation...</div>
          </div>
        ) : invitationData ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm">
                Welcome,{" "}
                <strong>
                  {invitationData.first_name} {invitationData.last_name}
                </strong>
                !
              </p>
              <p className="text-xs text-muted-foreground">
                Role: <strong>{invitationData.role}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={invitationData.email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
