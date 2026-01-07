"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardHeader } from "./components/dashboard-header"
import { createBrowserClient } from "@/lib/supabase/client"

interface UserProfile {
  first_name?: string
  last_name?: string
  email?: string
  role?: string
  is_admin?: boolean
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createBrowserClient()

      console.log("[v0] Fetching user in layout...")
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] User in layout:", user?.id, user?.email)

      if (user) {
        console.log("[v0] Querying profile for user:", user.id)
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, role")
          .eq("id", user.id)
          .maybeSingle()

        console.log("[v0] Profile query result:", profile)
        console.log("[v0] Profile query error:", error)

        if (profile) {
          const profileWithAdmin = {
            ...profile,
            is_admin: profile.role === "admin" || profile.role === "super_admin",
          }
          console.log("[v0] Setting profile with is_admin:", profileWithAdmin)
          setUserProfile(profileWithAdmin)
        } else {
          console.log("[v0] Profile not found, using fallback")
          const fallbackProfile = {
            email: user.email,
            role: "admin",
            is_admin: true,
          }
          console.log("[v0] Setting fallback profile:", fallbackProfile)
          setUserProfile(fallbackProfile)
        }
      } else {
        console.log("[v0] No user found in layout")
      }
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    console.log("[v0] Layout userProfile state changed:", userProfile)
  }, [userProfile])

  return (
    <SidebarProvider>
      <AppSidebar userProfile={userProfile} />
      <main className="flex-1 overflow-auto">
        <DashboardHeader />
        <div className="border-b border-border bg-background p-4">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
