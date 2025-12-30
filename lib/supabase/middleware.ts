import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { logger } from "@/lib/logger"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      if (error.message.includes("User from sub claim in JWT does not exist")) {
        // Clear all auth cookies
        const response = NextResponse.redirect(new URL("/auth/login", request.url))
        response.cookies.delete("sb-access-token")
        response.cookies.delete("sb-refresh-token")
        // Delete all cookies that start with sb-
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith("sb-")) {
            response.cookies.delete(cookie.name)
          }
        })
        return response
      }

      // "Auth session missing" is expected for unauthenticated users, not an error
      if (error.message !== "Auth session missing!") {
        logger.error("Supabase auth error", error)
      }
    } else {
      user = data.user
    }
  } catch (error) {
    logger.error("Failed to fetch user from Supabase", error)
    // Continue without user - don't block the request
  }

  // Redirect unauthenticated users to login (except for public routes)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/browse") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
