import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  authCallbackRateLimiter,
  getRateLimitIdentifier,
  getIpAddress,
} from "@/lib/ratelimit"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  // Rate limiting: Use IP address to prevent abuse of callback endpoint
  const headersList = new Headers(request.headers)
  const ipAddress = getIpAddress(headersList)
  const identifier = getRateLimitIdentifier(null, ipAddress)

  const { success: rateLimitSuccess } = await authCallbackRateLimiter.limit(identifier)

  if (!rateLimitSuccess) {
    // Redirect to login with error message
    return NextResponse.redirect(`${origin}/auth/login?error=rate_limit_exceeded`)
  }

  if (code) {
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
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Email confirmed successfully, redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // Log error for debugging
    console.error("[Auth Callback] Failed to exchange code for session:", error.message)
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
