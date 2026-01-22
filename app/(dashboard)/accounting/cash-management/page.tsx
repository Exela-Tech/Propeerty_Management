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
  getUndepositedFundsHistory,
} from "../actions"

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

  const [undepositedHistory, setUndepositedHistory] = useState<any[]>([])
  const [undepositedInfo, setUndepositedInfo] = useState<any>(null)
  const [loadingUndepositedHistory, setLoadingUndepositedHistory] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

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
        console.error("[v0] Error loading cash management:", error)
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
        console.error("[v0] Error loading bank transactions:", error)
      } finally {
        setLoadingTransactions(false)
      }
    }

    loadBankTransactions()
  }, [selectedBankForView])

  useEffect(() => {
    loadUndepositedHistory()
  }, [startDate, endDate]) // Added startDate and endDate to trigger reload when filters change

  const loadUndepositedHistory = async () => {
    setLoadingUndepositedHistory(true)
    try {
      const result = await getUndepositedFundsHistory(startDate || undefined, endDate || undefined)
      setUndepositedHistory(result.transactions)
      setUndepositedInfo(result.undepositedAccount)
    } catch (error) {
      console.error("[v0] Error loading undeposited funds history:", error)
    } finally {
      setLoadingUndepositedHistory(false)
    }
  }

  const handleDepositPayments = async () => {
    if (selectedPayments.size === 0 || !selectedBank) {
      alert("Please select payments and a bank account")
      return
    }

    try {
      const bankName = bankAccounts.find((b) => b.id === selectedBank)?.account_name || "Bank"
      const paymentCount = selectedPayments.size
      
      await createPaymentDeposit(
        selectedBank,
        Array.from(selectedPayments),
        new Date().toISOString().split("T")[0],
        depositRef,
      )
      setSelectedPayments(new Set())
      setDepositRef("")
      
      // Refresh all data after deposit
      const [funds, deps] = await Promise.all([getUndepositedFunds(), getPaymentDeposits()])
      setUndepositedFunds(funds)
      setDeposits(deps)

      // Reload the undeposited funds history to show the new credit entry
      await loadUndepositedHistory()

      // Reload bank transactions if viewing a bank
      if (selectedBankForView) {
        const result = await getBankTransactions(selectedBankForView)
        setBankTransactions(result.transactions)
      }
      
      alert(`Successfully deposited ${paymentCount} payment(s) to ${bankName}. Check the transaction history below to see the credit entry.`)
    } catch (error) {
      console.error("[v0] Error creating deposit:", error)
      alert("Failed to create deposit: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handleRefreshHistory = async () => {
    await loadUndepositedHistory()
  }

  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
  }

  const totalUndeposited = undepositedFunds.reduce((sum, p) => sum + p.amount, 0)

  const tenantPayments = undepositedFunds.filter((p) => p.type === "tenant_payment")
  const landlordPayments = undepositedFunds.filter((p) => p.type === "landlord_payment")
  const tenantTotal = tenantPayments.reduce((sum, p) => sum + p.amount, 0)
  const landlordTotal = landlordPayments.reduce((sum, p) => sum + p.amount, 0)

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
    .reverse()

  const undepositedHistoryWithBalance = undepositedHistory
    .map((transaction, index) => {
      const previousTransactions = undepositedHistory.slice(index + 1)
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
    .reverse()

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="undeposited">Undeposited Funds</TabsTrigger>
          <TabsTrigger value="deposits">Bank Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="undeposited">
          <Card>
            <CardHeader>
              <CardTitle>Undeposited Funds Transaction History</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Double-entry ledger showing payments received (debit) and deposits made to banks (credit)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 p-6 rounded-lg border-2 border-amber-400 dark:border-amber-700 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-3">
                  <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">
                    Deposit Payments to Bank
                  </h3>
                  <Badge variant="default" className="bg-amber-600">
                    {undepositedFunds.length} pending | {selectedPayments.size} selected
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Select Bank Account *
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full p-2.5 border-2 border-amber-300 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name} - {acc.bank_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Deposit Reference (Optional)
                    </label>
                    <Input
                      value={depositRef}
                      onChange={(e) => setDepositRef(e.target.value)}
                      placeholder="e.g., Daily deposit #123"
                      className="border-2 border-amber-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Select Payments to Deposit:
                    </span>
                    {undepositedFunds.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (selectedPayments.size === undepositedFunds.length) {
                            setSelectedPayments(new Set())
                          } else {
                            setSelectedPayments(new Set(undepositedFunds.map((p) => p.id)))
                          }
                        }}
                        className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 bg-transparent"
                      >
                        {selectedPayments.size === undepositedFunds.length ? "Deselect All" : "Select All"}
                      </Button>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto border-2 border-amber-300 rounded-md p-2 space-y-1 bg-white dark:bg-gray-900">
                    {undepositedFunds.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No pending payments to deposit. All funds have been deposited to bank.
                      </div>
                    ) : (
                      undepositedFunds.map((payment) => (
                        <label
                          key={payment.id}
                          className="flex items-center gap-2 p-2 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded cursor-pointer"
                        >
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
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="flex-1 text-sm">
                            {payment.payer_name} - {new Date(payment.payment_date).toLocaleDateString("en-GB")}
                          </span>
                          <span className="font-mono text-sm font-semibold text-green-700">
                            {payment.amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "UGX",
                              minimumFractionDigits: 0,
                            })}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleDepositPayments}
                  disabled={selectedPayments.size === 0 || !selectedBank}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-lg shadow-md disabled:bg-gray-400"
                  size="lg"
                >
                  Deposit {selectedPayments.size} Payment(s) to{" "}
                  {bankAccounts.find((b) => b.id === selectedBank)?.account_name || "Bank"}
                </Button>
              </div>

              <div className="flex items-end gap-4 pb-4 border-b">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
                <Button onClick={handleRefreshHistory} variant="secondary">
                  Refresh
                </Button>
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>

              {loadingUndepositedHistory ? (
                <div className="text-center py-8 text-muted-foreground">Loading transaction history...</div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                        <th className="text-right p-3 font-semibold text-green-700">Debit (Money In)</th>
                        <th className="text-right p-3 font-semibold text-red-700">Credit (Money Out)</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {undepositedHistoryWithBalance.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No transactions found for the selected period
                          </td>
                        </tr>
                      ) : (
                        undepositedHistoryWithBalance.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleDateString("en-GB")}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{transaction.description}</span>
                                {transaction.reference_type && (
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {transaction.reference_type.replace("_", " ")}
                                  </span>
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
                              {transaction.runningBalance.toLocaleString("en-US", {
                                style: "currency",
                                currency: "UGX",
                                minimumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Double-Entry Accounting:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-green-700">Debit (Money In)</strong> - When payments are received, increases
                    Undeposited Funds balance
                  </li>
                  <li>
                    <strong className="text-red-700">Credit (Money Out)</strong> - When deposited to bank, decreases
                    Undeposited Funds balance
                  </li>
                </ul>
              </div>
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
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedBankInfo.account_name}</h3>
                      <p className="text-sm text-muted-foreground">Account Code: {selectedBankInfo.account_code}</p>
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
                        transactionsWithBalance.map((transaction) => (
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
                    <strong className="text-green-700">Debit</strong> - Money coming INTO the bank (deposits from undeposited funds)
                  </li>
                  <li>
                    <strong className="text-red-700">Credit</strong> - Money going OUT of the bank (expenses, withdrawals)
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
