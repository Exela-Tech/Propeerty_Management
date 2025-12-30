"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, MessageSquare, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    // Fetch unread notifications and messages
    const fetchCounts = async () => {
      try {
        const [notifRes, messagesRes] = await Promise.all([
          fetch("/api/notifications/unread-count"),
          fetch("/api/messages/unread-count"),
        ])

        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setUnreadNotifications(notifData.count || 0)
        }

        if (messagesRes.ok) {
          const messageData = await messagesRes.json()
          setUnreadMessages(messageData.count || 0)
        }
      } catch (error) {
        console.error("[v0] Error fetching counts:", error)
      }
    }

    fetchCounts()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between border-b border-border bg-background p-4">
      <div />

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="block p-2 hover:bg-accent">
                View All Notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Messages */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuItem asChild>
              <Link href="/messages" className="block p-2 hover:bg-accent">
                View All Messages
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Admin Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/security">Security</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
