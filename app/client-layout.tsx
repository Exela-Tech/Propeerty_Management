"use client"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // Suppress harmless MetaMask connection errors from browser extensions
    const originalError = console.error
    console.error = (...args) => {
      if (args[0]?.toString?.().includes("MetaMask")) {
        return
      }
      originalError.apply(console, args)
    }

    window.addEventListener("error", (event) => {
      if (event.message?.includes("MetaMask")) {
        event.preventDefault()
      }
    })

    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason?.toString?.().includes("MetaMask")) {
        event.preventDefault()
      }
    })

    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <>
      {children}
      <Analytics />
      <Toaster />
    </>
  )
}
