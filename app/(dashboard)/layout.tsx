"use client"

import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardHeader } from "./components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
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
