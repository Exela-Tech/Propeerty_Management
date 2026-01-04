"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function NewChartOfAccountPage() {
  useEffect(() => {
    // Redirect to main chart of accounts page with dialog open
    window.location.href = "/admin/accounting/system/chart-of-accounts"
  }, [])

  return null
}
