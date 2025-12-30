import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const getGlobalClient = () => {
  if (typeof window === "undefined") return null

  if (!(window as any).__supabaseClient) {
    ;(window as any).__supabaseClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return (window as any).__supabaseClient
}

export function createClient() {
  const globalClient = getGlobalClient()
  if (globalClient) return globalClient

  // Fallback for SSR
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export function createBrowserClient() {
  return createClient()
}
