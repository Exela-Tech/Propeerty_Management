"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  description: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (error) {
      console.error("[v0] Error marking as read:", error)
    }
  }

  const typeColors: Record<string, string> = {
    landlord_due: "bg-red-100 text-red-800",
    tenant_due: "bg-orange-100 text-orange-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    message: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="space-y-4 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Stay updated on important events</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.is_read ? "border-blue-300" : ""}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <Badge className={typeColors[notification.type] || "bg-gray-100"}>
                      {notification.type.replace("_", " ")}
                    </Badge>
                  </div>
                  {notification.description && (
                    <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                    Mark as read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
