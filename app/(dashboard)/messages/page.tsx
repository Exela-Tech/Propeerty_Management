"use client"

import { useEffect, useState, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare } from "lucide-react"

interface Message {
  id: string
  sender_id: string
  message: string
  channel: string
  created_at: string
  is_read: boolean
}

interface Profile {
  first_name: string
  last_name: string
  email: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("general")
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)

  async function fetchCurrentUser() {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", user.id)
          .single()

        setCurrentUser(data)
      }
    } catch (error) {
      console.error(" Error fetching user:", error)
    }
  }

  const fetchMessages = useCallback(async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("channel", selectedChannel)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error(" Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedChannel])

  useEffect(() => {
    fetchMessages()
    fetchCurrentUser()
  }, [fetchMessages])

  async function sendMessage() {
    if (!newMessage.trim()) return

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("team_messages").insert([
        {
          sender_id: user.id,
          channel: selectedChannel,
          message: newMessage,
        },
      ])

      if (error) throw error
      setNewMessage("")
      fetchMessages()
    } catch (error) {
      console.error(" Error sending message:", error)
    }
  }

  return (
    <div className="space-y-4 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Messages</h1>
        <p className="text-muted-foreground">Communicate with your team</p>
      </div>

      {/* Channel selector */}
      <div className="flex gap-2">
        {["general", "announcements", "support"].map((channel) => (
          <Button
            key={channel}
            variant={selectedChannel === channel ? "default" : "outline"}
            onClick={() => setSelectedChannel(channel)}
            className="capitalize"
          >
            {channel}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading messages...</p>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No messages in this channel yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.reverse().map((message) => (
            <Card key={message.id}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
                <p className="mt-2">{message.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message input */}
      <Card>
        <CardContent className="pt-6 space-y-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                sendMessage()
              }
            }}
            rows={3}
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            Send Message
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
