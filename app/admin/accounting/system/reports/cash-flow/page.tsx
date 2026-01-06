"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import Link from "next/link"

export default function CashFlowPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            <span className="text-xl font-semibold">Cash Flow Statement</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/accounting/system">
              <Button variant="ghost">Back to Accounting</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>Cash flow statement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cash Flow report implementation coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
