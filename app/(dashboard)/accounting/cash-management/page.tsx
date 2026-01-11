"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getBankAccounts,
  getUndepositedFunds,
  getPaymentDeposits,
  createPaymentDeposit,
  getBankTransactions,
  getUndepositedFundsStatement,
} from "../actions"
import { Printer } from "lucide-react"

export default function CashManagementPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [undepositedFunds, setUndepositedFunds] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [depositRef, setDepositRef] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [selectedBankForView, setSelectedBankForView] = useState<string>("")
  const [bankTransactions, setBankTransactions] = useState<any[]>([])
  const [selectedBankInfo, setSelectedBankInfo] = useState<any>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Statement state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [statement, setStatement] = useState<any>(null)
  const [loadingStatement, setLoadingStatement] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accounts, funds, deps] = await Promise.all([
          getBankAccounts(),
          getUndepositedFunds(),
          getPaymentDeposits(),
        ])
        setBankAccounts(accounts)
        setUndepositedFunds(funds)
        setDeposits(deps)
        if (accounts.length > 0) {
          const trustAccount = accounts.find((a: any) => a.account_name?.toLowerCase().includes("trust"))
          setSelectedBank(trustAccount?.id || accounts[0].id)
          setSelectedBankForView(accounts[0].id)
        }
      } catch (error) {
        console.error(" Error loading cash management:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const loadBankTransactions = async () => {
      if (!selectedBankForView) return

      setLoadingTransactions(true)
      try {
        const result = await getBankTransactions(selectedBankForView)
        setBankTransactions(result.transactions)
        setSelectedBankInfo(result.bankAccount)
      } catch (error) {
        console.error(" Error loading bank transactions:", error)
      } finally {
        setLoadingTransactions(false)
      }
    }

    loadBankTransactions()
  }, [selectedBankForView])

  const handleDepositPayments = async () => {
    if (selectedPayments.size === 0 || !selectedBank) {
      alert("Please select payments and a bank account")
      return
    }

    try {
      await createPaymentDeposit(
        selectedBank,
        Array.from(selectedPayments),
        new Date().toISOString().split("T")[0],
        depositRef,
      )
      setSelectedPayments(new Set())
      setDepositRef("")
      // Refresh data
      const [funds, deps] = await Promise.all([getUndepositedFunds(), getPaymentDeposits()])
      setUndepositedFunds(funds)
      setDeposits(deps)

      if (selectedBankForView) {
        const result = await getBankTransactions(selectedBankForView)
        setBankTransactions(result.transactions)
      }
    } catch (error) {
      console.error(" Error creating deposit:", error)
      alert("Failed to create deposit")
    }
  }

  const transactionsWithBalance = bankTransactions
    .map((transaction, index) => {
      const previousTransactions = bankTransactions.slice(index + 1)
      const runningBalance =
        previousTransactions.reduce((balance, t) => {
          return balance + (t.debit || 0) - (t.credit || 0)
        }, 0) +
        (transaction.debit || 0) -
        (transaction.credit || 0)

      return {
        ...transaction,
        runningBalance,
      }
    })
    .reverse() // Reverse to show oldest first with running balance

  const totalUndeposited = undepositedFunds.reduce((sum, p) => sum + p.amount, 0)

  const tenantPayments = undepositedFunds.filter((p) => p.type === "tenant_payment")
  const landlordPayments = undepositedFunds.filter((p) => p.type === "landlord_payment")
  const tenantTotal = tenantPayments.reduce((sum, p) => sum + p.amount, 0)
  const landlordTotal = landlordPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Undeposited Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUndeposited.toLocaleString("en-US", {
                style: "currency",
                currency: "UGX",
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cash awaiting deposit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tenant Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantTotal.toLocaleString("en-US", {
                style: "currency",
                currency: "UGX",
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tenantPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Landlord Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {landlordTotal.toLocaleString("en-US", {
                style: "currency",
                currency: "UGX",
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{landlordPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="undeposited" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="undeposited">Undeposited Funds</TabsTrigger>
          <TabsTrigger value="statement">Monthly Statement</TabsTrigger>
          <TabsTrigger value="deposits">Bank Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="undeposited">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Undeposited Funds - General Ledger View</CardTitle>
                <Badge variant="secondary" className="text-lg">
                  {totalUndeposited.toLocaleString("en-US", {
                    style: "currency",
                    currency: "UGX",
                    minimumFractionDigits: 0,
                  })}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Showing GL entries where cash is received but not yet deposited to bank
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="block font-medium">Select Bank Account:</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.bank_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block font-medium">Deposit Reference:</label>
                <Input
                  placeholder="e.g., Deposit #001 or Check #12345"
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedPayments.size === undepositedFunds.length && undepositedFunds.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPayments(new Set(undepositedFunds.map((p) => p.id)))
                            } else {
                              setSelectedPayments(new Set())
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">From</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-right p-3 font-semibold text-green-700">Debit</th>
                      <th className="text-right p-3 font-semibold text-blue-700">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {undepositedFunds.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedPayments.has(payment.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedPayments)
                              if (e.target.checked) {
                                newSelected.add(payment.id)
                              } else {
                                newSelected.delete(payment.id)
                              }
                              setSelectedPayments(newSelected)
                            }}
                          />
                        </td>
                        <td className="p-3 font-mono">{payment.payment_date}</td>
                        <td className="p-3">{payment.payerName}</td>
                        <td className="p-3">
                          <Badge variant="outline">{payment.type === "tenant_payment" ? "Tenant" : "Landlord"}</Badge>
                        </td>
                        <td className="p-3 text-right font-mono text-green-700 font-semibold">
                          {payment.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "UGX",
                            minimumFractionDigits: 0,
                          })}
                        </td>
                        <td className="p-3 text-right font-mono text-muted-foreground">-</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold bg-muted">
                      <td colSpan={4} className="p-3 text-right">
                        Total:
                      </td>
                      <td className="p-3 text-right font-mono text-green-700">
                        {totalUndeposited.toLocaleString("en-US", {
                          style: "currency",
                          currency: "UGX",
                          minimumFractionDigits: 0,
                        })}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Accounting Entry:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-green-700">Debit: Undeposited Funds (Asset)</strong> - Cash received
                    increases this asset account
                  </li>
                  <li>
                    <strong>Credit: Rental Income (Revenue)</strong> - Not shown here, posted to income statement
                  </li>
                </ul>
              </div>

              <Button onClick={handleDepositPayments} disabled={selectedPayments.size === 0} className="w-full">
                Deposit {selectedPayments.size} Payment(s) to Bank
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statement">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Undeposited Funds Statement</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    View monthly statement showing all payments received (debits) and deposits made (credits)
                  </p>
                </div>
                <Button onClick={() => window.print()} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print Statement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Select Month</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(Number.parseInt(e.target.value))
                        setStatement(null)
                      }}
                      className="flex-1 p-2 border rounded-md"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {new Date(2000, month - 1, 1).toLocaleDateString("en-US", { month: "long" })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(Number.parseInt(e.target.value))
                        setStatement(null)
                      }}
                      className="flex-1 p-2 border rounded-md"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={async () => {
                        setLoadingStatement(true)
                        try {
                          const data = await getUndepositedFundsStatement(selectedYear, selectedMonth)
                          setStatement(data)
                        } catch (error) {
                          console.error("Error loading statement:", error)
                          alert("Failed to load statement")
                        } finally {
                          setLoadingStatement(false)
                        }
                      }}
                      disabled={loadingStatement}
                    >
                      {loadingStatement ? "Loading..." : "Load Statement"}
                    </Button>
                  </div>
                </div>
              </div>

              {statement && (
                <div className="space-y-4 print:break-inside-avoid">
                  {/* Statement Header - Print Only */}
                  <div className="hidden print:block mb-6">
                    <h2 className="text-2xl font-bold mb-2">Undeposited Funds Statement</h2>
                    <p className="text-lg">{statement.period.monthName}</p>
                    <p className="text-sm text-muted-foreground">
                      Period: {statement.period.startDate} to {statement.period.endDate}
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 print:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Opening Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">
                          {statement.openingBalance.toLocaleString("en-US", {
                            style: "currency",
                            currency: "UGX",
                            minimumFractionDigits: 0,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Total Debits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold text-green-700">
                          {statement.totalDebits.toLocaleString("en-US", {
                            style: "currency",
                            currency: "UGX",
                            minimumFractionDigits: 0,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Total Credits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold text-red-700">
                          {statement.totalCredits.toLocaleString("en-US", {
                            style: "currency",
                            currency: "UGX",
                            minimumFractionDigits: 0,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Closing Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">
                          {statement.closingBalance.toLocaleString("en-US", {
                            style: "currency",
                            currency: "UGX",
                            minimumFractionDigits: 0,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Statement Table */}
                  <div className="overflow-x-auto border rounded-lg print:border-0">
                    <table className="w-full text-sm print:text-xs">
                      <thead>
                        <tr className="border-b bg-muted print:bg-transparent">
                          <th className="text-left p-3 font-semibold">Date</th>
                          <th className="text-left p-3 font-semibold">Description</th>
                          <th className="text-left p-3 font-semibold">Type</th>
                          <th className="text-right p-3 font-semibold text-green-700">Debit</th>
                          <th className="text-right p-3 font-semibold text-red-700">Credit</th>
                          <th className="text-right p-3 font-semibold">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statement.entries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No transactions found for this period
                            </td>
                          </tr>
                        ) : (
                          <>
                            {/* Opening Balance Row */}
                            <tr className="border-b bg-muted/30 print:bg-transparent">
                              <td className="p-3 font-mono" colSpan={3}>
                                <strong>Opening Balance</strong>
                              </td>
                              <td className="p-3 text-right font-mono">-</td>
                              <td className="p-3 text-right font-mono">-</td>
                              <td className="p-3 text-right font-mono font-semibold">
                                {statement.openingBalance.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "UGX",
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                            </tr>
                            {/* Transaction Entries */}
                            {statement.entries.map((entry: any) => (
                              <tr key={entry.id} className="border-b hover:bg-muted/30 print:hover:bg-transparent">
                                <td className="p-3 font-mono text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString("en-GB")}
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{entry.description}</span>
                                    {entry.payerName && (
                                      <span className="text-xs text-muted-foreground">{entry.payerName}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline" className="text-xs">
                                    {entry.paymentType}
                                  </Badge>
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {entry.debit > 0 ? (
                                    <span className="text-green-700 font-semibold">
                                      {entry.debit.toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "UGX",
                                        minimumFractionDigits: 0,
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {entry.credit > 0 ? (
                                    <span className="text-red-700 font-semibold">
                                      {entry.credit.toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "UGX",
                                        minimumFractionDigits: 0,
                                      })}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono font-semibold">
                                  <span className={entry.runningBalance >= 0 ? "text-green-700" : "text-red-700"}>
                                    {entry.runningBalance.toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "UGX",
                                      minimumFractionDigits: 0,
                                    })}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {/* Totals Row */}
                            <tr className="border-t-2 font-bold bg-muted print:bg-transparent">
                              <td colSpan={3} className="p-3 text-right">
                                <strong>Totals</strong>
                              </td>
                              <td className="p-3 text-right font-mono text-green-700">
                                {statement.totalDebits.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "UGX",
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                              <td className="p-3 text-right font-mono text-red-700">
                                {statement.totalCredits.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "UGX",
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                              <td className="p-3 text-right font-mono font-semibold">
                                {statement.closingBalance.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "UGX",
                                  minimumFractionDigits: 0,
                                })}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Accounting Explanation */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg print:break-inside-avoid">
                    <p className="text-sm font-medium mb-2">Accounting Explanation:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>
                        <strong className="text-green-700">Debit (Payment Received):</strong> When a payment is
                        received, it is posted as a debit to Undeposited Funds, increasing the balance.
                      </li>
                      <li>
                        <strong className="text-red-700">Credit (Deposit Made):</strong> When payments are deposited to
                        the bank, it is posted as a credit to Undeposited Funds, decreasing the balance.
                      </li>
                      <li>
                        <strong>Balance:</strong> The running balance shows the amount of cash in Undeposited Funds at
                        any point in time. When all payments are deposited, the balance should be zero.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {!statement && !loadingStatement && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Select a month and click "Load Statement" to view the undeposited funds statement</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Transactions</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                View complete transaction history with running balance for each bank account
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="block font-medium">Select Bank Account:</label>
                <select
                  value={selectedBankForView}
                  onChange={(e) => setSelectedBankForView(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} - {acc.bank_name} ({acc.account_number})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBankInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedBankInfo.account_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedBankInfo.bank_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-bold">
                        {(
                          transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance || 0
                        ).toLocaleString("en-US", {
                          style: "currency",
                          currency: "UGX",
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loadingTransactions ? (
                <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                        <th className="text-right p-3 font-semibold text-green-700">Debit</th>
                        <th className="text-right p-3 font-semibold text-red-700">Credit</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsWithBalance.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No transactions found for this bank account
                          </td>
                        </tr>
                      ) : (
                        transactionsWithBalance.map((transaction, index) => (
                          <tr key={transaction.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleDateString("en-GB")}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{transaction.description}</span>
                                {transaction.reference && (
                                  <span className="text-xs text-muted-foreground">Ref: {transaction.reference}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono">
                              {transaction.debit > 0 ? (
                                <span className="text-green-700 font-semibold">
                                  {transaction.debit.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "UGX",
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono">
                              {transaction.credit > 0 ? (
                                <span className="text-red-700 font-semibold">
                                  {transaction.credit.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "UGX",
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold">
                              <span className={transaction.runningBalance >= 0 ? "text-green-700" : "text-red-700"}>
                                {transaction.runningBalance.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "UGX",
                                  minimumFractionDigits: 0,
                                })}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Understanding Bank Transactions:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-green-700">Debit</strong> - Money coming INTO the bank (deposits, income)
                  </li>
                  <li>
                    <strong className="text-red-700">Credit</strong> - Money going OUT of the bank (expenses,
                    withdrawals)
                  </li>
                  <li>
                    <strong>Balance</strong> - Running total showing current bank account balance
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
