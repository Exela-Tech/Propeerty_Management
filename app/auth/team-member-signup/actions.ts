"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function verifyInvitationToken(token: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, first_name, last_name, email, role, status")
      .eq("invitation_token", token)
      .single()

    if (error || !data) {
      return { error: "Invalid or expired invitation token" }
    }

    if (data.status !== "pending") {
      return { error: "This invitation has already been accepted" }
    }

    return { data }
  } catch (error) {
    return { error: "Failed to verify invitation" }
  }
}

export async function acceptInvitationAndCreateAccount(token: string, password: string) {
  const supabase = await createClient()

  try {
    // Verify the token first
    const { data: teamMember, error: verifyError } = await supabase
      .from("team_members")
      .select("id, email, role, created_by")
      .eq("invitation_token", token)
      .eq("status", "pending")
      .single()

    if (verifyError || !teamMember) {
      return { error: "Invalid or expired invitation token" }
    }

    // Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: teamMember.email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/dashboard`,
      },
    })

    if (authError || !authData.user) {
      return { error: authError?.message || "Failed to create account" }
    }

    // Update team member status to active
    const { error: updateError } = await supabase
      .from("team_members")
      .update({
        status: "active",
        invitation_token: null,
        invited_at: new Date().toISOString(),
      })
      .eq("id", teamMember.id)

    if (updateError) {
      return { error: "Account created but failed to activate team member" }
    }

    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Account created successfully! You can now log in.",
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create account",
    }
  }
}
