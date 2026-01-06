"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function TrialBalanceFromGLPage() {
  useEffect(() => {
    window.location.href = "/admin/accounting/system/reports/trial-balance"
  }, [])

  return null
}
