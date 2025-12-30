"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { deleteTeamMember } from "./actions"
import { Trash2 } from "lucide-react"

interface DeleteTeamMemberButtonProps {
  id: string
}

export function DeleteTeamMemberButton({ id }: DeleteTeamMemberButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this team member?")) return

    setLoading(true)
    try {
      const result = await deleteTeamMember(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Team member deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete team member",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
