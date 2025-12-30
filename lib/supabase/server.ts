import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let serverClient: ReturnType<typeof createSupabaseClient> | null = null

export async function createClient() {
  if (serverClient) return serverClient

  serverClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Disable session persistence on server
      },
    },
  )

  return serverClient
}

export const createServerClient = createClient
