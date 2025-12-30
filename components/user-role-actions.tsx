"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { UserRole } from "@/lib/types"
import { logger } from "@/lib/logger"

interface UserRoleActionsProps {
  userId: string
  currentRole: UserRole
}

export function UserRoleActions({ userId, currentRole }: UserRoleActionsProps) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(currentRole)
  const [isLoading, setIsLoading] = useState(false)

  const updateRole = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      logger.error("Error updating user role", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
        <SelectTrigger className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="seller">Seller</SelectItem>
          <SelectItem value="blocker">Blocker</SelectItem>
          <SelectItem value="landlord">Landlord</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={updateRole} disabled={isLoading || role === currentRole}>
        {isLoading ? "Updating..." : "Update Role"}
      </Button>
    </div>
  )
}
