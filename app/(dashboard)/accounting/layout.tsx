import type React from "react"
import Link from "next/link"

export const metadata = {
  title: "Accounting",
  description: "Chart of Accounts and Financial Records",
}

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground mt-2">Manage your chart of accounts and view financial records</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <Link
          href="/accounting/chart-of-accounts"
          className="px-4 py-2 border-b-2 border-transparent hover:border-primary transition-colors font-medium text-sm"
        >
          Chart of Accounts
        </Link>
        <Link
          href="/accounting/general-ledger"
          className="px-4 py-2 border-b-2 border-transparent hover:border-primary transition-colors font-medium text-sm"
        >
          General Ledger
        </Link>
        <Link
          href="/accounting/trial-balance"
          className="px-4 py-2 border-b-2 border-transparent hover:border-primary transition-colors font-medium text-sm"
        >
          Trial Balance
        </Link>
      </div>

      {children}
    </div>
  )
}
